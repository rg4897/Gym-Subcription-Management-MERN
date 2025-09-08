export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPut(path: string, body: any) {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


