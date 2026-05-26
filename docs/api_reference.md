# 🔌 API & Socket Reference

This document catalogs the REST API endpoints and real-time Socket.IO events for the DevCollab platform.

---

## 🌐 REST API Endpoints

All REST routes are prefixed with `/api` and require a JSON request body unless specified. Protected endpoints require a Bearer token in the `Authorization` header.

### 🔑 Authentication (`/api/auth`)
- `POST /register`: Registers a new user account.
- `POST /login`: Log in to get JWT token.
- `POST /logout` (Protected): Invalidate session/logout.
- `GET /me` (Protected): Get the current user profile.
- `PUT /profile` (Protected): Edit profile name and avatar.
- `PUT /password` (Protected): Change account password.

### 🏢 Workspace Management (`/api/workspaces`)
- `GET /` (Protected): Retrieve all workspaces the user belongs to.
- `POST /` (Protected): Create a new workspace.
- `GET /:id` (Protected): Get details of a single workspace.
- `PUT /:id` (Protected): Update workspace metadata.
- `GET /:id/stats` (Protected): Get task completion metrics and member stats.
- `POST /:id/invite` (Protected): Invite a user to the workspace using their email.
- `DELETE /:id/members/:userId` (Protected): Remove a member from the workspace.

### 📋 Projects (`/api/workspaces/:workspaceId/projects`)
- `GET /` (Protected): List all projects in a workspace.
- `POST /` (Protected): Create a project.
- `GET /:id` (Protected): Get project details and Kanban tasks.
- `PUT /:id` (Protected): Edit project name and details.
- `DELETE /:id` (Protected): Delete project and its tasks.

### 🛠️ Tasks (`/api/workspaces/:workspaceId/projects/:projectId/tasks`)
- `POST /` (Protected): Create a task.
- `PUT /:id` (Protected): Update a task's title, description, assignees, or priority.
- `PUT /:id/status`: Update status (Kanban column move).
- `DELETE /:id`: Remove a task.

---

## ⚡ Socket.IO Real-time Events

WebSockets manage real-time updates like task movement, typing status, user presence, and system notifications.

### 1. Client to Server Events
- `workspace:join (workspaceId)`: Join a room dedicated to workspace presence.
- `project:join (projectId)`: Join a room dedicated to a project board.
- `task:create (data)`: Emitted when a new task is created.
- `task:update (data)`: Emitted when a task is edited.
- `task:move (data)`: Emitted when a task is moved to a new column.
- `typing:start (data)`: Emitted when a user starts editing/typing in a task.
- `typing:stop (data)`: Emitted when typing ceases.
- `presence:update (data)`: Emitted when user updates their status ('online', 'busy', 'away') or views a page.
- `notification:send (data)`: Dispatches a real-time notification to a specific recipient.

### 2. Server to Client Broadcasts
- `user:online ({ userId, user })`: Broadcast to all sockets when a user connects.
- `user:offline ({ userId })`: Broadcast to all sockets when a user disconnects.
- `user:joined ({ user, workspaceId })`: Emitted inside a workspace room when a member joins.
- `task:created (data)`: Emitted to a project room when a task is created.
- `task:updated (data)`: Emitted to a project room when a task is modified.
- `task:moved (data)`: Emitted to a project room when a task moves columns. Includes who moved it.
- `user:typing ({ userId, name, taskId })`: Broadcasts typing indicator.
- `user:stopped-typing ({ userId, taskId })`: Clears typing indicator.
- `presence:changed ({ userId, status, currentView })`: Updates workspace members on a user's location and active status.
- `notification:new (notification)`: Sent specifically to the recipient's private `user:${userId}` room.
