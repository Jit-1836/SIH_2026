import { io } from 'socket.io-client';

// In Render / production deployment, connect to window.location.origin automatically
const SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : window.location.origin;

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('[Socket Service] Connected to RescueNet Server:', socket.id);
});

socket.on('disconnect', () => {
  console.warn('[Socket Service] Connection dropped. Reconnecting...');
});
