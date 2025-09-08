import axios from 'axios';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiGet(path: string) {
  const { data } = await api.get(path);
  return data;
}

export async function apiPost(path: string, body: any) {
  const { data } = await api.post(path, body);
  return data;
}

export async function apiPut(path: string, body: any) {
  const { data } = await api.put(path, body);
  return data;
}

export async function apiDelete(path: string) {
  const { data } = await api.delete(path);
  return data;
}
