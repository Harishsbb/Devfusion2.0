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

export const joinMeetingRoom = (meetingId) => socket?.emit('meeting:join-room', meetingId);
export const leaveMeetingRoom = (meetingId) => socket?.emit('meeting:leave-room', meetingId);
export const emitMediaState = (data) => socket?.emit('meeting:media-state', data);
export const emitHandRaise = (data) => socket?.emit('meeting:hand-raise', data);
export const emitRecordingStart = (meetingId) => socket?.emit('meeting:recording-start', { meetingId });
export const emitRecordingStop = (meetingId) => socket?.emit('meeting:recording-stop', { meetingId });
export const emitMeetingChatMessage = (data) => socket?.emit('meeting:chat-message', data);

// WebRTC signaling
export const emitNewPeer = (meetingId) => socket?.emit('meeting:webrtc-new-peer', { meetingId });
export const emitWebRTCOffer = (to, offer) => socket?.emit('meeting:webrtc-offer', { to, offer });
export const emitWebRTCAnswer = (to, answer) => socket?.emit('meeting:webrtc-answer', { to, answer });
export const emitWebRTCIce = (to, candidate) => socket?.emit('meeting:webrtc-ice', { to, candidate });
