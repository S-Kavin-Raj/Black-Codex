// WebSocket client utility (native WebSocket) for real-time updates

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001/ws';

import { getAuthToken } from './auth';

let ws: WebSocket | null = null;

export function connectSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return ws;
  const token = getAuthToken();
  const url = token ? `${SOCKET_URL}?token=${encodeURIComponent(token)}` : SOCKET_URL;
  ws = new WebSocket(url);

  ws.addEventListener('error', (e) => {
    // eslint-disable-next-line no-console
    console.error('WebSocket error', e);
  });

  ws.addEventListener('close', () => {
    // eslint-disable-next-line no-console
    console.info('WebSocket closed');
    ws = null;
  });

  // send initial auth message if token available once open
  ws.addEventListener('open', () => {
    const token = getAuthToken();
    if (token) {
      try { ws?.send(JSON.stringify({ type: 'authenticate', token })); } catch (e) { /* ignore */ }
    }
  });

  // Listen for token refresh events and re-authenticate if needed
  try {
    window.addEventListener('auth:token-refreshed', (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        const newToken = detail?.token;
        if (newToken && ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'authenticate', token: newToken }));
        }
      } catch (e) { /* ignore */ }
    });
  } catch (e) { /* ignore in non-browser envs */ }

  return ws;
}

export function sendSocketMessage(msg: any) {
  const socket = connectSocket();
  const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(payload);
  } else {
    socket.addEventListener('open', () => socket.send(payload), { once: true });
  }
}

export function onSocketMessage(cb: (ev: MessageEvent) => void) {
  const socket = connectSocket();
  socket.addEventListener('message', cb);
  return () => socket.removeEventListener('message', cb);
}
