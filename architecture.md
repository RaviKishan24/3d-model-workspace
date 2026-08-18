# Architecture & Deployment Guide

## 1. Logical architecture
React SPA (Vite build, static) Express REST API (stateless)
├── Context API: auth + toasts ├── /api/auth register, login, logout, me
├── Axios instance (withCredentials) ├── /api/models CRUD + presigned download
├── React Router (lazy routes) ├── /api/uploads presigned PUT
└── Three.js / R3F viewer chunk └── /api/models/:id/views camera states
| |
| HTTPS + HTTP-only cookie ├── MongoDB (Mongoose)
└─────────────────────────────────────────────┤
└── Supabase Storage (model binaries)

text

### Upload sequence
Browser API Supabase MongoDB
| POST /uploads/presigned-url | |
|─────────────────────────►| validate ext/MIME/size | |
| | sign PUT (5 min) | |
|◄─────── uploadUrl, storagePath | | |
| PUT file (direct) | |
|───────────────────────────────────────────────────►| store object |
| POST /models { name, fileName, storagePath } | |
|─────────────────────────►| create metadata ──────────────────────────►|
|◄──────────────── model | | |

text

Model binaries never pass through the API server, keeping instances small and the upload path
independent of API scaling.

### Saved-view sequence
Save: OrbitControls target + camera.position/rotation/zoom
→ POST /api/models/:id/views → ViewerState document (userId + modelId scoped)

Restore: GET /api/models/:id/views → user picks a view
→ camera lerps to saved position, controls.target lerps to saved target

text

Because state lives in MongoDB and not in memory, views survive logout and instance replacement.

---

## 2. Production topology
INTERNET
|
v
Vercel / Netlify CDN
(React SPA)
|
v
Render / Fly.io
(Express API)
|
+----------+----------+
| |
v v
MongoDB Atlas Supabase Storage
(users, models, (3D model files)
viewer states)

text

**Why this architecture works:**
- **Vercel** serves the static React build with global CDN and HTTPS.
- **Render** runs the Node.js API with auto‑restart and environment management.
- **MongoDB Atlas** provides managed database with automatic backups.
- **Supabase Storage** offers signed URLs for secure file access with built‑in CDN.

Routing `/api/*` through Vercel rewrites keeps the API same‑origin with the frontend,
letting the auth cookie use `SameSite=Lax` and avoiding CORS entirely.

---

## 3. Statelessness rules

1. No in-memory sessions — JWT cookie verified on each request.
2. No local disk uploads — Supabase Storage is the only file store.
3. No in-process caches that affect correctness.
4. `/health` returns quickly without touching the database.
5. `SIGTERM` triggers `server.close()` to drain in-flight requests.

The default `express-rate-limit` store is per instance. For strict global limits, use
Redis or platform-level rate limiting.

---

## 4. Deploying the frontend (Vercel)

```bash
cd client
VITE_API_URL=https://your-api.onrender.com npm run build
Vercel Configuration:

Framework Preset: Vite

Root Directory: client

Build Command: npm run build

Output Directory: dist

Environment Variable: VITE_API_URL=https://your-api.onrender.com

Vercel Rewrites (client/vercel.json):

json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-api.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/" }
  ]
}
5. Deploying the backend (Render)
Render Configuration:

Root Directory: server

Build Command: npm install

Start Command: node src/server.js

Environment Variables:

text
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=...
SUPABASE_STORAGE_BUCKET=3d-models
CLIENT_URL=https://your-frontend.vercel.app
MAX_UPLOAD_BYTES=52428800
6. Storage (Supabase)
Bucket	Contents	Access
3d-models	models/{userId}/{timestamp}.glb	Private; presigned URLs only
Supabase Configuration:

Create bucket via Supabase Dashboard → Storage

Set bucket to private

RLS policies: users only access their own files

7. Environment variables
Backend (.env):

text
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=...
SUPABASE_STORAGE_BUCKET=3d-models
CLIENT_URL=https://your-frontend.vercel.app
MAX_UPLOAD_BYTES=52428800
Frontend (.env):

text
VITE_API_URL=https://your-api.onrender.com
Security notes:

Never commit .env files to Git.

Use .env.example for required variables.

SUPABASE_SECRET_KEY is the service role key – keep it secret.

8. Observability
Render provides built‑in logs and metrics.

Vercel provides deployment logs and performance metrics.

MongoDB Atlas provides database metrics and alerts.

Supabase provides storage metrics and logs.

Alarms worth setting:

API response latency > 1 second

Error rate > 1%

MongoDB connection pool exhaustion

Supabase storage near limit

9. Scaling considerations
Horizontal scaling:

Render: Multiple instances (paid tier)

Vercel: CDN scales globally

MongoDB Atlas: Scale cluster size

Supabase: Storage scales automatically

Performance optimization:

MongoDB indexes (already applied)

Pagination (already implemented)

Signed URLs for direct uploads (already implemented)

Code splitting (already implemented)

10. Security summary

Layer	Measure
Authentication	JWT in HTTP-only cookies, bcrypt hashing
Authorization	Every query scoped by userId
Transport	HTTPS everywhere (Vercel/Render/Atlas/Supabase)
API	Rate limiting, helmet, CORS, validation
Storage	Presigned URLs, private bucket
Secrets	Environment variables only
11. Comparison: AWS vs Supabase
Feature	AWS Approach	Supabase Approach
File Storage	S3 bucket	Supabase Storage
Presigned URLs	AWS SDK	Supabase SDK
CDN	CloudFront	Built‑in CDN
Cost	Free tier (limited)	Free tier (1GB)
Complexity	Higher	Lower
Setup Time	Hours	Minutes
Why Supabase: Simpler setup, generous free tier, built‑in signed URLs and CDN, no IAM policy
management, faster development cycle.



