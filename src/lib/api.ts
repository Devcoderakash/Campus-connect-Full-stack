/**
 * src/lib/api.ts
 *
 * Lightweight fetch-based API client for Campus Connect.
 *
 * We use native fetch instead of axios because this file is imported by
 * AuthContext which is evaluated server-side during SSR (TanStack Start).
 * axios → follow-redirects uses Error.captureStackTrace in a way that
 * crashes Bun's SSR runtime at module initialisation time.
 *
 * fetch is available in both Bun and the browser natively.
 */

export const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";
export const BASE_URL = `${SOCKET_URL}/api`;

// ── Token helpers ──────────────────────────────────────────────────────────

const getToken = (): string | null => {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem("cc_token");
};

// ── Generic request helper ─────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:logout"));
    }
    // Mimic the shape callers expect: err.response.data.message
    const err: any = new Error(data?.message ?? `Request failed: ${res.status}`);
    err.response = { data, status: res.status };
    throw err;
  }

  return data as T;
}

// ── Convenience methods ────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),

  postForm: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = getToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }
      const err: any = new Error(data?.message ?? `Request failed: ${res.status}`);
      err.response = { data, status: res.status };
      throw err;
    }

    return data as T;
  },

  /**
   * GET an external URL with a bearer token (used for Google userinfo).
   * This runs client-side only so we can use fetch directly.
   */
  getExternal: async <T>(url: string, bearerToken: string): Promise<T> => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data?.error ?? "External request failed");
      err.response = { data, status: res.status };
      throw err;
    }
    return data as T;
  },
};
