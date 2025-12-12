// Simple token-based auth helper (frontend)
const TOKEN_KEY = 'codex_auth_token';

export function setAuthToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch (e) { /* ignore */ }
}

export function getAuthToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
}

export function clearAuthToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
}

export async function login(username: string, password: string, apiBase?: string) {
  const base = apiBase || (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  if (data?.token) setAuthToken(data.token);
  return data;
}

export async function logout(apiBase?: string) {
  const base = apiBase || (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
  try { await fetch(`${base}/auth/logout`, { method: 'POST', credentials: 'include' }); } catch (e) { /* ignore */ }
  clearAuthToken();
}

export function isAuthenticated() {
  return !!getAuthToken();
}

export async function refreshToken(apiBase?: string) {
  const base = apiBase || (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
  try {
    const res = await fetch(`${base}/auth/refresh`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` } });
    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();
    if (data?.token) {
      setAuthToken(data.token);
      // Notify other parts of the app (e.g., WebSocket) that token refreshed
      try { window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: { token: data.token } })); } catch (e) { /* ignore */ }
    }
    return data?.token || null;
  } catch (error) {
    clearAuthToken();
    return null;
  }
}
