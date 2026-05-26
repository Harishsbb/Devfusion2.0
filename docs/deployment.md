# 🚢 Deployment & Load Balancing Guide

This document describes how to deploy the DevCollab full-stack application and set up horizontal scaling using clustering and Nginx load balancing.

---

## 💻 Local Development Setup

Follow these steps to run both the frontend and backend in development mode:

1. **Install Dependencies**:
   ```bash
   # From the workspace root
   cd server && npm install
   cd ../client && npm install
   ```

2. **Configure Local Environment**:
   Create a `.env` file in the `server` directory and configure the environment:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/devcollab
   JWT_SECRET=devcollab_super_secret_jwt_key
   CLIENT_URL=http://localhost:5173
   ```

3. **Seed Database**:
   ```bash
   cd server && npm run seed
   ```

4. **Launch Applications**:
   - Backend: `npm run dev` (runs a single-instance node process)
   - Clustered Backend: `npm run dev:cluster` (scales across all available cores)
   - Frontend: `npm run dev` inside the `client/` folder.

---

## ☁️ Production Cloud Deployment

### 1. Frontend (Vercel)
The React client is configured for deployment on Vercel:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Environment Variables**:
  - `VITE_SOCKET_URL`: Set to the public URL of your Express backend server.

### 2. Backend (Render / VPS)
Deploy the Express API server on a persistent platform (such as Render or a dedicated VPS) since it requires WebSockets:
- **Build Command**: `npm install`
- **Start Command**: `npm start` (for single process) or `npm run start:cluster` (to launch the primary load balancer and worker processes)
- **Environment Variables**:
  - `PORT`: Define the public listening port (e.g. `5000` or `10000`).
  - `NODE_ENV`: `production`
  - `ENABLE_CLUSTER`: `true` (enables multi-core horizontal clustering).
  - `MONGODB_URI`: Your MongoDB Atlas production connection string.
  - `CLIENT_URL`: The URL of your Vercel frontend.

---

## ⚖️ Scaling & Load Balancing

### 1. Internal Clustered Mode (Single Machine)
If you deploy to a server with multiple CPU cores, enable clustered mode by setting:
```env
ENABLE_CLUSTER=true
```
When this variable is set to `true`:
- The entrypoint launches a **primary process** that binds to the defined `PORT` and initializes `@socket.io/sticky` to intercept TCP connections.
- It forks **worker processes** matching the number of cores (using `os.cpus().length`).
- It initiates `@socket.io/cluster-adapter` to enable direct worker-to-worker room messaging over IPC (Inter-Process Communication).
- Connection sticky sessions are handled automatically at the TCP level.

### 2. Nginx Load Balancer Mode (Multi-Machine / PM2)
If you deploy multiple distinct servers or run multiple processes on different local ports (e.g., `5001`, `5002`, `5003`, `5004`), use Nginx as an external load balancer.

The pre-configured `deployment/nginx.conf` file is optimized for this:
- **Sticky Session routing**: Using the `ip_hash` upstream directive, ensuring that client handshakes are routed to the same port/host:
  ```nginx
  upstream backend_servers {
      ip_hash;
      server 127.0.0.1:5001;
      server 127.0.0.1:5002;
      server 127.0.0.1:5003;
  }
  ```
- **WebSocket Upgrade Tunnels**: Setup proxy headers for `Upgrade` and `Connection` to support WebSocket communication:
  ```nginx
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  ```
- **Tuned persistent timeouts**: Disables response buffering (`proxy_buffering off`) and sets timeouts to `7d` (7 days) to prevent Nginx from severing long-lived, idle connections.
