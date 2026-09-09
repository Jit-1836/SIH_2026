import { io } from 'socket.io-client';

// Automatically detect host IP so local Wi-Fi mobile clients connect to the host server
const SERVER_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : `http://${window.location.hostname}:5000`;

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('[Socket Service] Connected to Local Emergency Network:', socket.id);
});

socket.on('disconnect', () => {
  console.warn('[Socket Service] Disconnected from Local Network. Queueing offline requests.');
});
