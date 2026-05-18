# ⚡ DevCollab — Collaborate. Build. Ship Faster.

A modern, production-grade full-stack collaboration platform for developer teams, powered by AI.

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

**Terminal 1 — Backend:**
```bash
cd server && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client && npm run dev
```

Visit `http://localhost:5173`

---

## 🏗️ Architecture

```
devcollab/
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/db.js       # MongoDB Atlas connection
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Workspace.js
│   │   │   ├── Project.js
│   │   │   ├── Task.js
│   │   │   ├── Notification.js
│   │   │   ├── Snippet.js
│   │   │   └── Document.js
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # Express routers
│   │   ├── middleware/        # Auth, error handling
│   │   ├── socket/            # Socket.IO handlers
│   │   └── seed/              # Sample data seeder
│   └── server.js              # Entry point
│
└── client/                    # React + Vite frontend
    └── src/
        ├── pages/             # Route-level components
        ├── components/        # Reusable UI components
        ├── lib/               # API client, Socket.IO, utils
        └── store/             # Zustand state management
```

## 🎯 Features

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| Workspace Management | ✅ |
| Project Dashboard | ✅ |
| Drag-and-drop Kanban | ✅ |
| Real-time via Socket.IO | ✅ |
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

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| State | Zustand |
| UI | Lucide Icons, Recharts |
| DnD | @dnd-kit/core |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT + bcryptjs |
| AI | Mock AI (swap in Gemini/OpenAI API key) |

## 🤖 AI Integration

The AI features use a mock implementation. To connect to a real AI API:

1. Add your API key to `server/.env`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

2. Update `server/src/controllers/aiController.js` to use the actual API

## 🚢 Deployment

- **Frontend**: Deploy `client/` to Vercel
- **Backend**: Deploy `server/` to Render
- Update `CLIENT_URL` in server `.env` to your Vercel domain
