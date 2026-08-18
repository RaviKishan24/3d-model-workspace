# 3D Model Workspace

A production-ready MERN + Three.js application where authenticated users upload 3D models
(`.glb`, `.gltf`, `.obj`) to Supabase Storage, inspect them in a browser 3D viewer, and save named
camera views that persist across sessions.

**Stack:** React 18 + Vite + JavaScript + Tailwind CSS + Three.js + React Three Fiber + drei +
React Router + Axios + Context API on the frontend. Node.js + Express + MongoDB + Mongoose +
JWT + bcryptjs on the backend. Supabase Storage for file hosting. MongoDB Atlas for database.

---

## 1. What the application does

| Step | Behaviour |
| --- | --- |
| Landing page | Product overview with "Get Started" and "Login" CTAs |
| Register | Name, email, password, confirm password — validated on client and server |
| Login | Email + password → bcrypt compare → JWT issued in an HTTP-only cookie |
| Dashboard | Usage stats, "Upload 3D Model", grid of the signed-in user's models |
| Upload | Presigned Supabase URL → browser PUTs the file → metadata saved in MongoDB |
| Viewer | Three.js scene with orbit / zoom / pan, auto-centering and camera fit |
| Save View | Camera position, rotation, zoom and orbit target stored in MongoDB |
| Saved Views | Load (smooth animated restore) or delete any saved view |
| Logout | Auth cookie cleared, client state reset, redirect to login |

---

## 2. Features

- **Authentication** — bcryptjs (12 salt rounds), JWT, HTTP-only `SameSite` cookie, `/api/auth/me`
  session restore, rate-limited auth endpoints.
- **Model upload** — extension + MIME + size validation on both sides, direct-to-Supabase presigned
  `PUT` with live progress, metadata stored after upload.
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
- **Cloud-ready** — stateless API, `/health` endpoint, graceful shutdown, Supabase Storage with
  signed URLs for secure file access.

---

## 3. Architecture

### Request flow
React (Vite SPA)
| Axios, withCredentials
v
Express REST API ──► MongoDB (users, models, viewer states)
|
└──► Supabase Storage (presigned PUT / GET for 3D binaries)

text

### Production topology
INTERNET
|
v
Vercel / Netlify
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

**Why it scales:** the API keeps **no session state in memory**. Auth is a signed JWT in a cookie,
uploads go straight from the browser to Supabase, and all shared state lives in MongoDB or
Supabase Storage. Any instance in the auto-scaling group can serve any request.

### Project structure
3d-model-workspace/
├── client/ React + Vite + Tailwind + Three.js
│ └── src/
│ ├── components/ Navbar, ModelCard, UploadModal, viewer/*
│ ├── pages/ Landing, Login, Register, Dashboard, Models, Viewer, Profile
│ ├── context/ AuthContext, ToastContext
│ ├── hooks/ useAuth, useModels, useSavedViews
│ ├── services/ api (axios), authService, modelService
│ ├── utils/ validation, fileValidation, three helpers
│ ├── App.jsx Routes + React.lazy code splitting
│ └── main.jsx
├── server/ Express + Mongoose
│ └── src/
│ ├── config/ db.js, supabase.js
│ ├── controllers/ authController, modelController, uploadController, viewerController
│ ├── middleware/ auth, error, validation, rateLimit
│ ├── models/ User.js, Model.js, ViewerState.js
│ ├── routes/ authRoutes, modelRoutes, uploadRoutes, viewerRoutes
│ ├── services/ authService.js, supabaseService.js
│ ├── app.js Express app
│ └── server.js Bootstrap + graceful shutdown
├── docs/architecture.md
├── .env.example
└── README.md

text

---

## 4. Data models
User Model ViewerState
├── name ├── userId (indexed) ├── userId (indexed)
├── email (unique idx) ├── name ├── modelId (indexed)
├── password (bcrypt) ├── fileName ├── name
├── createdAt ├── fileType ├── camera { position, rotation, zoom }
└── updatedAt ├── fileSize ├── target { x, y, z }
├── storagePath (unique) ├── createdAt
├── fileUrl └── updatedAt
├── createdAt
└── updatedAt

text

Indexes: `User.email` (unique), `Model.userId`, `Model.{userId, createdAt}`,
`ViewerState.{userId, modelId, createdAt}` and a unique `{userId, modelId, name}`.

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
| POST | `/api/models` | ✅ | Register metadata after upload |
| DELETE | `/api/models/:id` | ✅ | Delete file, metadata and saved views |
| POST | `/api/uploads/presigned-url` | ✅ | Short-lived Supabase `PUT` URL |
| GET | `/api/models/:modelId/views` | ✅ | List saved camera states |
| POST | `/api/models/:modelId/views` | ✅ | Save a camera state |
| PUT | `/api/models/:modelId/views/:viewId` | ✅ | Rename / update a saved view |
| DELETE | `/api/models/:modelId/views/:viewId` | ✅ | Delete a saved view |
| GET | `/health` | – | Health check |

**Saved view payload:**

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
6. Security
bcryptjs password hashing, 12 salt rounds; password is select: false.

JWT signed with JWT_SECRET, 7-day expiry, delivered in an HTTP-only cookie
(secure + SameSite=None in production).

HTTPS in production via Vercel/Render's built-in SSL.

Helmet security headers, CORS restricted to CLIENT_URL with credentials: true.

Validation with express-validator on every write, JSON body cap of 100 KB.

File validation — allow-listed extension, matching content type, 50 MB size ceiling.

Rate limiting — 20 auth requests / 15 min, 300 API requests / min, 60 uploads / hour.

Authorization — every model and view query includes userId; upload keys verified.

Secrets live only in .env (local) or environment variables (production).

Stack traces suppressed in production responses.

7. Optimization
Frontend — route-level React.lazy + Suspense; three/fiber/drei is a separate chunk;
memo on grid cards; AbortController cancels requests on unmount; DPR capped on high-density
displays; geometries, materials and textures disposed on unmount.

3D — GLB recommended (single binary, Draco-compatible); bounding-box camera fitting;
50 MB ceiling keeps loads bounded.

Backend — compound MongoDB indexes, .lean() reads, pagination, countDocuments + fetch in
parallel, gzip via compression, bounded connection pool, centralized error handling.

Cloud — Vercel CDN caches React bundle; Supabase Storage provides built-in CDN for models;
uploads bypass API server entirely.

8. Local setup
Prerequisites: Node 18+, MongoDB instance (local or Atlas), Supabase account with Storage bucket.

bash
# Backend
cd server
cp .env.example .env      # fill MONGODB_URI, JWT_SECRET, SUPABASE_* values
npm install
npm run dev               # http://localhost:5000

# Frontend (second terminal)
cd client
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm install
npm run dev               # http://localhost:5173
Generate a strong JWT secret with openssl rand -hex 48.

9. Deployment
Frontend → Vercel/Netlify. npm run build, deploy via Git integration.
Set VITE_API_URL to your backend URL.

Backend → Render/Fly.io. Deploy server/ with environment variables:
MONGODB_URI, JWT_SECRET, SUPABASE_URL, SUPABASE_SECRET_KEY,
SUPABASE_STORAGE_BUCKET, CLIENT_URL, NODE_ENV=production.

MongoDB Atlas. Free tier cluster with network access allowed.

Supabase Storage. Create bucket, set to private with signed URLs (already implemented).

10. Acceptance criteria checklist
Register ✅ · Login ✅ · Logout ✅ · JWT auth ✅ · bcrypt hashing ✅ ·
Protected routes ✅ · Upload model ✅ · Stored in Supabase ✅ · Metadata in MongoDB ✅ ·
List models ✅ · Open model ✅ · Three.js render ✅ · Rotate ✅ · Zoom ✅ · Pan ✅ ·
Reset camera ✅ · Save camera state ✅ · Load/delete saved views ✅ ·
Views persist across logout ✅ · Cross-user access blocked ✅ · Responsive ✅ ·
Loading/error/empty states ✅ · Modular API ✅ · Centralized error handling ✅ ·
Security best practices ✅ · Lazy loading & code splitting ✅ · MongoDB indexes ✅ ·
Supabase Storage ✅ · Vercel + Render deployment ✅ · Stateless & scalable ✅ ·
Documentation ✅