# Deploying Spacio to WSO2 Choreo

Spacio deploys as **two Choreo components + an external MongoDB**:

| Piece | Choreo component | Built from |
|---|---|---|
| `server/` (Express API) | **Service** | `server/Dockerfile` |
| React SPA (repo root) | **Web Application** | root `Dockerfile` (nginx) |
| MongoDB | external — **MongoDB Atlas** (free M0) | — |

The frontend's nginx **proxies `/api` and `/uploads` to the backend** (set via the
`BACKEND_URL` env var), so the browser sees a single origin — relative `/api` calls
and the `httpOnly` refresh cookie work with no code changes.

---

## 1. MongoDB Atlas
1. Create a free **M0** cluster.
2. **Database Access** → add a user (username + password).
3. **Network Access** → allow `0.0.0.0/0`.
4. **Connect → Drivers** → copy the connection string (you'll use it as `MONGODB_URI`):
   `mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/spacio?retryWrites=true&w=majority`

## 2. Backend — Service component
1. Choreo → **Create Project** → **Create Component → Service**.
2. Connect GitHub → this repo → `main`.
3. Build: **Component Directory** = `server`, **Buildpack** = Dockerfile, **Dockerfile** = `server/Dockerfile`.
   (Endpoint is read from `server/.choreo/component.yaml`: REST, port `5000`, base path `/`, Public.)
4. **Configs & Secrets** → add environment variables:
   | Key | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas string |
   | `JWT_SECRET` | a long random string |
   | `JWT_REFRESH_SECRET` | a **different** long random string |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `CLIENT_URL` | the frontend URL (fill in after step 3, then redeploy) |
   > ⚠️ In production the server **refuses to start** if `JWT_SECRET` / `JWT_REFRESH_SECRET`
   > are missing, identical, or insecure — set both to distinct strong values.
5. **Build → Deploy** (Development env). Copy the public **backend URL**.

## 3. Frontend — Web Application component
1. **Create Component → Web Application**, same repo + `main`.
2. Build: **Component Directory** = `/`, **Buildpack** = Dockerfile, **Dockerfile** = `Dockerfile`, **Port** = `80`.
3. **Configs & Secrets** → add:
   | Key | Value |
   |---|---|
   | `BACKEND_URL` | the backend URL from step 2 (e.g. `https://xxxx.choreoapis.dev`) — **no trailing slash** |
4. **Build → Deploy**. Copy the public **frontend URL**.

## 4. Connect the two
1. Set the backend's `CLIENT_URL` (step 2.4) to the frontend URL → **redeploy backend**.
   (CORS isn't strictly needed since nginx proxies same-origin, but `CLIENT_URL` is still read.)
2. Open the frontend URL → register an account → create/save a design.

## 5. Promote to Production
Once it works in Development, use Choreo's **Promote** to push each component to the
Production environment (set the Prod `BACKEND_URL` to the Prod backend URL).

---

## Notes / limitations
- **Uploads are ephemeral.** Custom `.glb` models saved to `server/uploads/` are lost on
  restart/redeploy (container filesystem). For real persistence use object storage.
- **`BACKEND_URL` has no trailing slash** — nginx appends the paths (`/api/`, `/uploads/`).
- Local Docker still works unchanged: `docker compose up --build` sets
  `BACKEND_URL=http://backend:5005` automatically.
