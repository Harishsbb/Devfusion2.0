const jwt = require('jsonwebtoken');
const User = require('../models/User');

const onlineUsers = new Map();

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    
    // Join a private user-specific room for targeted messages (e.g. notifications) across the cluster
    socket.join(`user:${userId}`);

    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    io.emit('user:online', { userId, user: socket.user });

    socket.on('workspace:join', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      socket.to(`workspace:${workspaceId}`).emit('user:joined', {
        user: { _id: socket.user._id, name: socket.user.name, avatar: socket.user.avatar },
        workspaceId,
      });
    });

    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('task:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:updated', data);
    });

    socket.on('task:move', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:moved', {
        ...data,
        movedBy: { name: socket.user.name, avatar: socket.user.avatar },
      });
    });

    socket.on('task:create', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:created', data);
    });

    socket.on('typing:start', (data) => {
      socket.to(`project:${data.projectId}`).emit('user:typing', {
        userId: socket.user._id,
        name: socket.user.name,
        taskId: data.taskId,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`project:${data.projectId}`).emit('user:stopped-typing', {
        userId: socket.user._id,
        taskId: data.taskId,
      });
    });

    socket.on('notification:send', (data) => {
      // Broadcast to the user-specific room across the entire cluster
      io.to(`user:${data.recipientId}`).emit('notification:new', data.notification);
    });

    socket.on('presence:update', (data) => {
      socket.to(`workspace:${data.workspaceId}`).emit('presence:changed', {
        userId: socket.user._id,
        status: data.status,
        currentView: data.currentView,
      });
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user:offline', { userId });
    });
  });
};

module.exports = { setupSocket, onlineUsers };
