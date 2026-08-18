import { getStaffSession, setStaffSession } from '../state/store';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const session = getStaffSession();
  if (!session) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          setStaffSession(null); // refresh token is dead too - back to the staff picker
          return null;
        }
        const data = await res.json();
        setStaffSession({ ...session, accessToken: data.accessToken, refreshToken: data.refreshToken });
        return data.accessToken as string;
      })
      .catch(() => {
        setStaffSession(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// `auth: false` for the handful of endpoints reachable before any driver is
// signed in (device setup's branch login, the driver picker, PIN login).
export async function apiFetch<T>(path: string, init: RequestInit = {}, opts: { auth?: boolean } = {}): Promise<T> {
  const auth = opts.auth ?? true;

  const doFetch = (token: string | undefined) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

  let res = await doFetch(auth ? getStaffSession()?.accessToken : undefined);

  if (res.status === 401 && auth && getStaffSession()) {
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
