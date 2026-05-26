# ⚡ DevCollab — Collaborate. Build. Ship Faster.

A modern, production-grade full-stack collaboration platform for developer teams, powered by AI.

---

## 📖 Project Documentation

We have created comprehensive developer guides to help you understand, build, and deploy this project:
- [🏗️ System Architecture & Database Design](docs/architecture.md): Database models, Zustand stores, and client-server flow.
- [🔌 API & Socket.IO Reference](docs/api_reference.md): Detailed REST endpoints and WebSocket message events.
- [🤖 AI Integration & Features](docs/ai_features.md): How AI features work, data shapes, and instructions for connecting Gemini / OpenAI APIs.
- [🚢 Deployment & Load Balancing](docs/deployment.md): Steps to host on Vercel, Render, VPS, and configure internal Clustering or external Nginx load balancing.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (connection string in `server/.env`)

### 1. Install Dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install
```

### 2. Configure Environment

The `server/.env` is pre-configured with MongoDB Atlas. Update if needed:

```env
PORT=5000
MONGODB_URI=mongodb+srv://admin:harish123@cluster0.cfoj6si.mongodb.net/devcollab
JWT_SECRET=devcollab_super_secret_jwt_key_2024_production
CLIENT_URL=http://localhost:5173
```

### 3. Seed Sample Data

```bash
cd server && npm run seed
```

This creates:
- 4 test users
- 1 workspace ("DevCollab HQ")
- 3 projects
- 12 tasks across all Kanban columns
- Notifications, snippets, and documents

**Test credentials:**
- `harish@devcollab.io` / `password123` (Owner)
- `monisha@devcollab.io` / `password123` (Admin)
- `arjun@devcollab.io` / `password123` (Member)
- `priya@devcollab.io` / `password123` (Member)

### 4. Start Development Servers

**Terminal 1 — Backend (Select one):**
```bash
# Option A: Run a single-instance process (Standard)
npm run dev:server

# Option B: Run a clustered load-balanced server scaling to all CPU cores
npm run dev:server:cluster
```

**Terminal 2 — Frontend:**
```bash
npm run dev:client
```

Visit `http://localhost:5173`

---

## 🏗️ Architecture Layout

```
devcollab/
├── deployment/                # Production load balancer files
│   └── nginx.conf             # Nginx reverse proxy load balancer configuration
├── docs/                      # Architectural & developer guides
│   ├── architecture.md
│   ├── api_reference.md
│   ├── ai_features.md
│   └── deployment.md
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/db.js       # MongoDB Atlas connection
│   │   ├── models/            # Mongoose schemas
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # Express routers
│   │   ├── middleware/        # Auth, error handling
│   │   ├── socket/            # Socket.IO handlers (Clustering support)
│   │   └── seed/              # Sample data seeder
│   └── server.js              # Entry point (Clustered / Sticky Sessions support)
│
└── client/                    # React + Vite frontend
    └── src/
        ├── pages/             # Route-level components
        ├── components/        # Reusable UI components
        ├── lib/               # API client, Socket.IO, utils
        └── store/             # Zustand state management
```

---

## 🎯 Features

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| Workspace Management | ✅ |
| Project Dashboard | ✅ |
| Drag-and-drop Kanban | ✅ |
| Real-time via Socket.IO | ✅ |
| Horizontal Clustering & Load Balancing | ✅ |
| AI Task Breakdown | ✅ |
| AI Standup Generator | ✅ |
| AI Code Review | ✅ |
| AI Chat Assistant | ✅ |
| Code Snippet Manager | ✅ |
| Documentation Wiki | ✅ |
| Analytics Dashboard | ✅ |
| Notifications | ✅ |
| Dark/Light Mode | ✅ |
| Mobile Responsive | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| State | Zustand |
| UI | Lucide Icons, Recharts |
| DnD | @dnd-kit/core |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Real-time | Socket.IO + Cluster Adapter + Sticky Routing |
| Auth | JWT + bcryptjs |
| AI | Mock AI (swap in Gemini/OpenAI API key) |

