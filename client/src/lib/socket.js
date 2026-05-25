import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket?.connected) return socket;
  const socketUrl = import.meta.env.VITE_SOCKET_URL || '/';
  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  socket.on('connect', () => console.log('Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const joinWorkspace = (workspaceId) => socket?.emit('workspace:join', workspaceId);
export const joinProject = (projectId) => socket?.emit('project:join', projectId);

export const emitTaskUpdate = (data) => socket?.emit('task:update', data);
export const emitTaskMove = (data) => socket?.emit('task:move', data);
export const emitTaskCreate = (data) => socket?.emit('task:create', data);
export const emitTypingStart = (data) => socket?.emit('typing:start', data);
export const emitTypingStop = (data) => socket?.emit('typing:stop', data);
export const emitPresenceUpdate = (data) => socket?.emit('presence:update', data);
