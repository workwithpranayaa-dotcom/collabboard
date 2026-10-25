import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cb_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function saveAuth(token: string, user: unknown) {
  localStorage.setItem("cb_token", token);
  localStorage.setItem("cb_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("cb_token");
  localStorage.removeItem("cb_user");
}

export function getStoredUser<T = { id: string; name: string; email: string }>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("cb_user");
  return raw ? (JSON.parse(raw) as T) : null;
}
