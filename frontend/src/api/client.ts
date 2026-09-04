const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
}