# 3D Model Workspace

A production-ready MERN + Three.js application where authenticated users upload 3D models
(`.glb`, `.gltf`, `.obj`) to Amazon S3, inspect them in a browser 3D viewer, and save named
camera views that persist across sessions.

Stack: **React 18 + Vite + JavaScript + Tailwind CSS + Three.js + React Three Fiber + drei +
React Router + Axios + Context API** on the frontend, **Node.js + Express + MongoDB + Mongoose +
JWT + bcryptjs** on the backend, **AWS S3 / CloudFront / ALB / EC2 Auto Scaling** for delivery.
No TypeScript anywhere — every file is `.js` or `.jsx`.

---

## 1. What the application does

| Step | Behaviour |
| --- | --- |
| Landing page | Product overview with "Get Started" and "Login" CTAs |
| Register | Name, email, password, confirm password — validated on client and server |
| Login | Email + password → bcrypt compare → JWT issued in an HTTP-only cookie |
| Dashboard | Usage stats, "Upload 3D Model", grid of the signed-in user's models |
| Upload | Presigned S3 URL → browser PUTs the file to S3 → metadata saved in MongoDB |
| Viewer | Three.js scene with orbit / zoom / pan, auto-centering and camera fit |
| Save View | Camera position, rotation, zoom and orbit target stored in MongoDB |
| Saved Views | Load (smooth animated restore) or delete any saved view |
| Logout | Auth cookie cleared, client state reset, redirect to login |
| Login again | Open the same model → saved views are still listed → load restores the exact camera |

---

## 2. Features

- **Authentication** — bcryptjs (12 salt rounds), JWT, HTTP-only `SameSite` cookie, `/api/auth/me`
  session restore, rate-limited auth endpoints.
- **Model upload** — extension + MIME + size validation on both sides, direct-to-S3 presigned
  `PUT` with live progress, `HEAD` verification before metadata is persisted.
- **3D visualisation** — GLTFLoader (with Draco support) and OBJLoader, ambient + directional
  lighting, HDR environment, optional grid, wireframe and background switching.
- **Rotation / zoom / pan** — `OrbitControls` with damping; one-finger orbit and two-finger
  pan/zoom on touch devices.
- **Auto centering & camera fit** — bounding box → centre → camera distance from the model's
  largest dimension and the camera FOV, so any model scale produces a sensible first view.
- **Saved views & camera persistence** — multiple named views per model, animated restore,
  stored per user + per model in MongoDB.
- **Ownership isolation** — every query is scoped by `userId`; another user's model or view id
  simply returns 404.
- **Responsive UI** — Tailwind only, mobile through desktop, viewer fills the viewport.
- **AWS-ready** — stateless API, `/health` endpoint for ALB target groups, graceful shutdown for
  scale-in, CloudFront-aware file URLs.

---

## 3. Architecture

Request flow:

```
React (Vite SPA)
      |  Axios, withCredentials
      v
Express REST API  ──►  MongoDB (users, models, viewer states)
      |
      └──►  AWS S3 (presigned PUT / GET for 3D binaries)
```

Production topology:

```
                     INTERNET
                         |
                         v
                    CloudFront
                         |
              +----------+----------+
              |                     |
              v                     v
        React frontend        Application API
            (S3)                     |
                                     v
                            Application Load
                                Balancer (HTTPS)
                                     |
                          +----------+----------+
                          |                     |
                          v                     v
                        EC2                   EC2
                   Node + Express        Node + Express
                          |                     |
                          +----------+----------+
                                     |
                                     v
                                 MongoDB (Atlas)

                          AWS S3  ◄── 3D model files
```

Why it scales: the API keeps **no session state in memory**. Auth is a signed JWT in a cookie,
uploads go straight from the browser to S3, and all shared state lives in MongoDB or S3. Any EC2
instance in the Auto Scaling Group can serve any request.

### Project structure

```
3d-model-workspace/
├── client/                  React + Vite + Tailwind + Three.js (JavaScript)
│   └── src/
│       ├── components/      Navbar, ModelCard, UploadModal, viewer/*
│       ├── pages/           Landing, Login, Register, Dashboard, Models, Viewer, Profile
│       ├── context/         AuthContext, ToastContext
│       ├── hooks/           useAuth, useModels, useSavedViews
│       ├── services/        api (axios instance), authService, modelService
│       ├── utils/           validation, fileValidation, three helpers
│       ├── App.jsx          Routes + React.lazy code splitting
│       └── main.jsx
├── server/                  Express + Mongoose (JavaScript)
│   └── src/
│       ├── config/          db.js, aws.js
│       ├── controllers/     authController, modelController, uploadController, viewerController
│       ├── middleware/      authMiddleware, errorMiddleware, validationMiddleware, rateLimitMiddleware
│       ├── models/          User.js, Model.js, ViewerState.js
│       ├── routes/          authRoutes, modelRoutes, uploadRoutes, viewerRoutes
│       ├── services/        authService.js, s3Service.js
│       ├── app.js           Express app (importable/testable)
│       └── server.js        Bootstrap + graceful shutdown
├── docs/architecture.md
├── .env.example
└── README.md
```

---

## 4. Data models

```
User                     Model                        ViewerState
├── name                 ├── userId  (indexed)        ├── userId   (indexed)
├── email  (unique idx)  ├── name                     ├── modelId  (indexed)
├── password (bcrypt)    ├── fileName                 ├── name
├── createdAt            ├── fileType                 ├── camera { position, rotation, zoom }
└── updatedAt            ├── fileSize                 ├── target { x, y, z }
                         ├── s3Key (unique)           ├── createdAt
                         ├── fileUrl                  └── updatedAt
                         ├── createdAt
                         └── updatedAt
```

Indexes: `User.email` (unique), `Model.userId`, `Model.{userId, createdAt}`,
`ViewerState.{userId, modelId, createdAt}` and a unique `{userId, modelId, name}` so view names
stay unique per model.

---

## 5. REST API

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Create account, set auth cookie |
| POST | `/api/auth/login` | – | Verify credentials, set auth cookie |
| POST | `/api/auth/logout` | – | Clear auth cookie |
| GET | `/api/auth/me` | ✅ | Current user (session restore) |
| GET | `/api/models?page=&limit=` | ✅ | Paginated list of the user's models |
| GET | `/api/models/:id` | ✅ | Metadata + presigned download URL |
| POST | `/api/models` | ✅ | Register metadata after an S3 upload |
| DELETE | `/api/models/:id` | ✅ | Delete S3 object, metadata and saved views |
| POST | `/api/uploads/presigned-url` | ✅ | Short-lived S3 `PUT` URL |
| GET | `/api/models/:modelId/views` | ✅ | List saved camera states |
| POST | `/api/models/:modelId/views` | ✅ | Save a camera state |
| PUT | `/api/models/:modelId/views/:viewId` | ✅ | Rename / update a saved view |
| DELETE | `/api/models/:modelId/views/:viewId` | ✅ | Delete a saved view |
| GET | `/health` | – | ALB health check |

Saved view payload:

```json
{
  "name": "Front View",
  "camera": {
    "position": { "x": 2.5, "y": 1.8, "z": 5 },
    "rotation": { "x": 0, "y": 0, "z": 0 },
    "zoom": 1
  },
  "target": { "x": 0, "y": 0, "z": 0 }
}
```

---

## 6. Security

- **bcryptjs** password hashing, 12 salt rounds; `password` is `select: false` and never serialised.
- **JWT** signed with `JWT_SECRET`, 7-day expiry, delivered in an **HTTP-only** cookie
  (`secure` + `SameSite=None` in production) so page JavaScript cannot read it.
- **HTTPS** in production via ACM certificates on CloudFront and the ALB; secure cookies refuse
  plain HTTP.
- **Helmet** security headers, **CORS** restricted to `CLIENT_URL` with `credentials: true`.
- **Validation** with express-validator on every write, plus JSON body cap of 100 KB.
- **File validation** — allow-listed extension, matching content type, and a size ceiling
  (`MAX_UPLOAD_BYTES`, default 50 MB) enforced before a presigned URL is issued and again with a
  `HEAD` check afterwards.
- **Rate limiting** — 20 auth requests / 15 min, 300 API requests / min, 60 uploads / hour.
- **Authorization** — every model and view query includes `userId`, and presigned upload keys are
  verified to start with `models/{req.user.id}/`.
- **Secrets** live only in `.env` (local) or SSM Parameter Store / Secrets Manager and EC2 IAM
  roles (production). No AWS keys, Mongo URI or JWT secret ever reaches the frontend bundle.
- Stack traces and internal messages are suppressed in production responses.

---

## 7. Optimization

**Frontend** — route-level `React.lazy` + Suspense; the `three`/fiber/drei bundle is a separate
manual chunk fetched only when a viewer opens; `memo` on grid cards; `AbortController` cancels
in-flight requests on unmount; DPR is capped on high-density displays; every geometry, material
and texture is disposed when a model unmounts, and the Draco decoder is released too.

**3D** — GLB is the recommended format (single binary, Draco-compatible); bounding-box camera
fitting avoids blind zooming; a 50 MB ceiling keeps loads bounded.

**Backend** — compound MongoDB indexes matched to the actual queries, `.lean()` reads,
pagination on the model list, `countDocuments` + page fetch issued in parallel, gzip via
`compression`, bounded connection pool, centralized error handling.

**AWS** — CloudFront caches the React bundle and the model files; hashed Vite asset filenames
allow long `max-age`; uploads bypass EC2 entirely so instances stay small.

---

## 8. Local setup

Prerequisites: Node 18+, a MongoDB instance (local or Atlas), an S3 bucket.

```bash
# Backend
cd server
cp .env.example .env      # fill MONGODB_URI, JWT_SECRET, AWS_* values
npm install
npm run dev               # http://localhost:5000

# Frontend (second terminal)
cd client
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm install
npm run dev               # http://localhost:5173
```

Generate a strong JWT secret with `openssl rand -hex 48`.

### Required S3 bucket CORS

The browser uploads directly to S3, so the bucket must allow it:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["http://localhost:5173", "https://your-domain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Keep **Block all public access enabled** — reads happen through presigned GET URLs or a
CloudFront origin access control, never public objects.

---

## 9. Deployment

Full step-by-step commands, IAM policy, launch template user data, scaling policy and CloudFront
behaviours are in [`docs/architecture.md`](docs/architecture.md). Summary:

1. **React → S3 + CloudFront.** `npm run build` in `client/`, sync `dist/` to a private S3
   bucket, front it with CloudFront (OAC), set the SPA error response `403/404 → /index.html`,
   attach an ACM certificate.
2. **Express → EC2 behind an ALB.** Build an AMI or launch template that runs the app under
   `pm2`/systemd on port 5000, register instances in a target group with `/health` checks, put an
   HTTPS listener (ACM) on the ALB.
3. **Auto Scaling Group.** min 2, desired 2, max 4, across two Availability Zones, with a target
   tracking policy on average CPU (or `ALBRequestCountPerTarget`).
4. **MongoDB Atlas.** Private/VPC-peered cluster; connection string supplied through SSM.
5. **S3 model bucket.** Private, SSE-AES256, CORS as above; the API's IAM role gets only
   `GetObject`/`PutObject`/`DeleteObject`/`HeadObject` on `models/*`.

---

## 10. Acceptance criteria checklist

Register ✅ · Login ✅ · Logout ✅ · JWT auth ✅ · bcrypt hashing ✅ · Protected routes (client
guard + server middleware) ✅ · Upload model ✅ · Stored in S3 ✅ · Metadata in MongoDB ✅ ·
List models ✅ · Open model ✅ · Three.js render ✅ · Rotate ✅ · Zoom ✅ · Pan ✅ · Reset camera ✅ ·
Save camera state ✅ · Create / load / delete saved views ✅ · Views persist in MongoDB across
logout ✅ · Cross-user access blocked ✅ · Responsive ✅ · Loading / error / empty states ✅ ·
Modular API ✅ · Centralized error handling ✅ · Security best practices ✅ · Lazy loading and code
splitting ✅ · MongoDB indexes ✅ · S3 storage ✅ · CloudFront, EC2, ALB, Auto Scaling, HTTPS in the
deployment architecture ✅ · Stateless and scalable ✅ · Documentation ✅
