import { getSession, setSession } from '../state/sessionStore';

// Same-origin in production; points at the local NestJS dev server by
// default so `npm run dev` works standalone.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Single-flight refresh: if several requests 401 at once (e.g. a burst of
// bump taps right as the access token expires), they all await the same
// in-flight refresh instead of each firing their own /auth/refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const session = getSession();
  if (!session) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          setSession(null); // refresh token is dead too - back to the login screen
          return null;
        }
        const data = await res.json();
        setSession({ ...session, accessToken: data.accessToken, refreshToken: data.refreshToken });
        return data.accessToken as string;
      })
      .catch(() => {
        setSession(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const doFetch = (token: string | undefined) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

  let res = await doFetch(getSession()?.accessToken);

  if (res.status === 401 && getSession()) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch(newToken);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message || 'Something went wrong');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
