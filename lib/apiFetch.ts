//lib/apiFetch.ts
export type ApiError = { status: number; message: string };

function getApiBase() {
  if (typeof window !== "undefined") {
    return "/api/driver";
  }

  return process.env.NEXT_PUBLIC_API;
}

let refreshing: Promise<boolean> | null = null;
const CT_APP = "driver";

function isAuthPath(path: string) {
  return (
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/logout") ||
    path.startsWith("/auth/register") ||
    path.startsWith("/auth/forgot-password") ||
    path.startsWith("/auth/reset-password") ||
    path.startsWith("/auth/request-password-reset") ||
    path.startsWith("/auth/password-reset/")
  );
}

async function refreshSession(): Promise<boolean> {
  const API_BASE = getApiBase();
  if (!API_BASE) return false;

  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-ct-app": CT_APP,
          },
          cache: "no-store",
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }

  return refreshing;
}

async function readBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  const text = await res.text().catch(() => "");
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const API_BASE = getApiBase();

  if (!API_BASE) {
    throw { status: 0, message: "Falta NEXT_PUBLIC_API en .env.local" } satisfies ApiError;
  }

  const method = String(options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has("x-ct-app")) {
    headers.set("x-ct-app", CT_APP);
  }

  const hasBody = options.body != null && method !== "GET" && method !== "HEAD";
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const doFetch = async () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include",
      cache: options.cache ?? "no-store",
    });

  let res = await doFetch();

  if ((res.status === 401 || res.status === 403) && !isAuthPath(path)) {
    const ok = await refreshSession();
    if (ok) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    const msgAny = await readBody<any>(res);
    const msg =
      typeof msgAny === "string"
        ? msgAny
        : String(msgAny?.message ?? msgAny?.error ?? "").trim();

    throw {
      status: res.status,
      message: msg || `Error ${res.status}`,
    } satisfies ApiError;
  }

  return await readBody<T>(res);
}
