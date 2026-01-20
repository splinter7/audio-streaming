export const config = {
  apiUrl: 'http://localhost:3001/api',
  bufferThresholdSeconds: 10,
  maxReconnectAttempts: 3,
  iceServers: [
    // Disabled for localhost testing - not needed when both client and server are on same machine
    // { urls: 'stun:stun.l.google.com:19302' },
    // { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
