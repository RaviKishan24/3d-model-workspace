# Architecture & Deployment Guide

## 1. Logical architecture

```
React SPA (Vite build, static)              Express REST API (stateless)
  ├── Context API: auth + toasts              ├── /api/auth      register, login, logout, me
  ├── Axios instance (withCredentials)        ├── /api/models    CRUD + presigned download
  ├── React Router (lazy routes)              ├── /api/uploads   presigned PUT
  └── Three.js / R3F viewer chunk             └── /api/models/:id/views  camera states
             |                                             |
             |  HTTPS + HTTP-only cookie                   ├── MongoDB (Mongoose)
             └─────────────────────────────────────────────┤
                                                           └── AWS S3 (model binaries)
```

### Upload sequence

```
Browser                      API                      S3                MongoDB
   |  POST /uploads/presigned-url                       |                   |
   |─────────────────────────►|  validate ext/MIME/size |                   |
   |                          |  sign PUT (15 min)      |                   |
   |◄─────── uploadUrl, s3Key |                         |                   |
   |  PUT file (direct)                                 |                   |
   |───────────────────────────────────────────────────►|  store object     |
   |  POST /models { name, fileName, s3Key }            |                   |
   |─────────────────────────►|  HEAD object ──────────►|                   |
   |                          |  create metadata ──────────────────────────►|
   |◄──────────────── model   |                         |                   |
```

Model binaries never pass through EC2, which keeps instances small and makes the upload path
independent of API scaling.

### Saved-view sequence

```
Save:    OrbitControls target + camera.position/rotation/zoom
           → POST /api/models/:id/views  → ViewerState document (userId + modelId scoped)

Restore: GET /api/models/:id/views → user picks a view
           → camera lerps to saved position, controls.target lerps to saved target
```

Because state lives in MongoDB and not in the browser or in instance memory, views survive
logout, a new device, and any EC2 instance replacement.

## 2. Production topology

```
                     INTERNET
                         |
                    CloudFront (ACM cert, HTTPS only)
              /                              \
   default behaviour                    /api/* behaviour
   S3 origin (React build, OAC)         ALB origin (no cache)
                                             |
                                   Application Load Balancer
                                    HTTPS :443 → target :5000
                                             |
                                Auto Scaling Group (2 AZs)
                                   min 2 / desired 2 / max 4
                                     |               |
                                   EC2             EC2
                              Node + Express   Node + Express
                                     \              /
                                      MongoDB Atlas
                                            +
                                    S3 (private model bucket)
```

Routing `/api/*` through the same CloudFront distribution keeps the API same-origin with the
frontend, which lets the auth cookie use `SameSite=Lax` and avoids CORS entirely. If the API is
served from its own subdomain instead, keep `SameSite=None; Secure` and set `COOKIE_DOMAIN`.

## 3. Statelessness rules

1. No in-memory sessions — authentication is a signed JWT cookie verified on each request.
2. No local disk uploads — S3 is the only file store.
3. No in-process caches that affect correctness.
4. `/health` returns quickly without touching the database, so a slow query never fails a health
   check and triggers spurious replacements.
5. `SIGTERM` triggers `server.close()` so in-flight requests drain during deploys and scale-in.

The default `express-rate-limit` store is per instance, so limits are per instance. For strict
global limits, back it with Redis (ElastiCache) or use an AWS WAF rate rule on the ALB.

## 4. Deploying the frontend (S3 + CloudFront)

```bash
cd client
VITE_API_URL=https://app.example.com npm run build

aws s3 sync dist/ s3://my-frontend-bucket --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude index.html

aws s3 cp dist/index.html s3://my-frontend-bucket/index.html \
  --cache-control "no-cache"

aws cloudfront create-invalidation --distribution-id EXXXXXXXXXXXXX --paths "/index.html"
```

CloudFront settings:

- Origin: the frontend bucket with **Origin Access Control** (bucket stays private).
- Viewer protocol policy: **Redirect HTTP to HTTPS**; certificate from ACM (us-east-1).
- Custom error responses: `403 → /index.html (200)` and `404 → /index.html (200)` for SPA routing.
- Extra behaviour: path `/api/*` → ALB origin, cache policy **CachingDisabled**, origin request
  policy **AllViewer** so cookies and auth headers reach Express.

## 5. Deploying the backend (EC2 + ALB + Auto Scaling)

IAM role for the instances (least privilege):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:HeadObject"],
      "Resource": "arn:aws:s3:::my-model-bucket/models/*"
    },
    {
      "Effect": "Allow",
      "Action": ["ssm:GetParametersByPath", "ssm:GetParameter"],
      "Resource": "arn:aws:ssm:*:*:parameter/3dmw/*"
    }
  ]
}
```

Launch template user data:

```bash
#!/bin/bash
set -e
dnf install -y nodejs git
npm install -g pm2

cd /opt && git clone https://github.com/<you>/3d-model-workspace.git app
cd /opt/app/server && npm ci --omit=dev

# Secrets come from SSM Parameter Store — never baked into the AMI.
aws ssm get-parameters-by-path --path /3dmw/ --with-decryption \
  --query "Parameters[].{n:Name,v:Value}" --output text \
  | awk '{ sub(".*/", "", $1); print $1"="$2 }' > /opt/app/server/.env

echo "NODE_ENV=production" >> /opt/app/server/.env
pm2 start src/server.js --name api -i max
pm2 startup systemd -u root --hp /root && pm2 save
```

Target group and ALB:

- Target group: HTTP, port 5000, health check path `/health`, healthy threshold 2, interval 15 s.
- ALB: internet-facing across two public subnets; HTTPS :443 listener with an ACM certificate
  forwarding to the target group; HTTP :80 listener redirecting to HTTPS.
- Security groups: ALB allows 80/443 from the internet; instances allow 5000 **only** from the
  ALB security group.

Auto Scaling Group:

```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name 3dmw-api-asg \
  --launch-template LaunchTemplateName=3dmw-api,Version=1 \
  --min-size 2 --desired-capacity 2 --max-size 4 \
  --vpc-zone-identifier "subnet-aaa,subnet-bbb" \
  --target-group-arns arn:aws:elasticloadbalancing:...:targetgroup/3dmw-api/... \
  --health-check-type ELB --health-check-grace-period 90

aws autoscaling put-scaling-policy \
  --auto-scaling-group-name 3dmw-api-asg \
  --policy-name cpu-target-50 --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {"PredefinedMetricType": "ASGAverageCPUUtilization"},
    "TargetValue": 50.0
  }'
```

Alternative metric for a request-bound workload: `ALBRequestCountPerTarget` with a target of
roughly 1000 requests per target per minute. Two AZs and a minimum of 2 instances mean a single
instance or AZ failure never takes the API down.

## 6. Storage buckets

| Bucket | Contents | Access |
| --- | --- | --- |
| `my-frontend-bucket` | React build output | Private; CloudFront OAC only |
| `my-model-bucket` | `models/{userId}/{modelId}/model.glb` | Private; presigned URLs only |

Model bucket configuration: Block Public Access **on**, default encryption **SSE-S3 (AES256)**,
versioning on, the CORS rule from the README, and optionally a lifecycle rule moving objects to
Intelligent-Tiering after 30 days.

## 7. Environment variables

Backend: `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `COOKIE_DOMAIN`,
`AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`*, `AWS_SECRET_ACCESS_KEY`*,
`CLOUDFRONT_DOMAIN`, `CLIENT_URL`, `MAX_UPLOAD_BYTES`.

\* Omit both keys in production and rely on the EC2 instance role.

Frontend (build time): `VITE_API_URL`. Anything in a `VITE_*` variable is public — never put a
secret there.

## 8. Observability

- CloudWatch metrics: ASG CPU, `TargetResponseTime`, `HTTPCode_Target_5XX_Count`, `UnHealthyHostCount`.
- Ship `morgan` output and pm2 logs to CloudWatch Logs with the CloudWatch agent.
- Alarms worth setting: unhealthy hosts ≥ 1, p95 latency > 1 s, 5xx rate > 1 %.
