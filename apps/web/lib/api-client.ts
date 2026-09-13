const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const AUTH_CHANGED_EVENT = 'auth-changed';

function notifyAuthChanged(): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

function hasAccessToken(): boolean {
  return Boolean(getAccessToken());
}

function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  notifyAuthChanged();
}

function clearTokens(): void {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);

  notifyAuthChanged();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
    }

    const body = await res.json().catch(() => ({
      message: res.statusText,
    }));

    const message =
      typeof body?.message === 'string'
        ? body.message
        : typeof body?.message?.message === 'string'
          ? body.message.message
          : res.statusText;

    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  upload: async <T>(path: string, formData: FormData) => {
    const token =
      typeof window === 'undefined'
        ? null
        : window.localStorage.getItem('accessToken');

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json() as Promise<T>;
  },

  hasAccessToken,
  setTokens,
  clearTokens,
};

export { ApiError, AUTH_CHANGED_EVENT };
