const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
export function token() { return localStorage.getItem("aja_token"); }
export async function api(path, options = {}) {
  const headers = { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...options.headers };
  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
