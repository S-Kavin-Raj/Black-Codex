// Centralized API utility for backend requests
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import { getAuthToken, refreshToken } from './auth';

function buildHeaders(hasBody = false) {
  const headers: Record<string, string> = {};
  if (hasBody) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res: Response, retryFn?: () => Promise<Response>) {
  if (res.status === 401 && retryFn) {
    // Try to refresh token once
    try {
      const newToken = await refreshToken();
      if (newToken) {
        const retried = await retryFn();
        if (!retried.ok) throw new Error(await retried.text());
        return retried.json();
      }
    } catch (e) {
      throw new Error('Unauthorized');
    }
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiGet(path: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { credentials: 'include', headers: buildHeaders(false) });
  return handleResponse(res, () => fetch(url, { credentials: 'include', headers: buildHeaders(false) }));
}

export async function apiPost(path: string, data: any) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(true),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(res, () => fetch(url, { method: 'POST', headers: buildHeaders(true), credentials: 'include', body: JSON.stringify(data) }));
}

export async function apiPut(path: string, data: any) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: buildHeaders(true),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse(res, () => fetch(url, { method: 'PUT', headers: buildHeaders(true), credentials: 'include', body: JSON.stringify(data) }));
}

export async function apiDelete(path: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(false),
    credentials: 'include',
  });
  return handleResponse(res, () => fetch(url, { method: 'DELETE', headers: buildHeaders(false), credentials: 'include' }));
}

// Add more methods as needed
