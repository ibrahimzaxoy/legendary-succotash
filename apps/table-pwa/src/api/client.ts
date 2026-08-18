// The API base is same-origin in production (served behind one reverse
// proxy alongside the table PWA) but points at the local NestJS dev server
// by default so `npm run dev` works standalone.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message || 'Something went wrong');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
