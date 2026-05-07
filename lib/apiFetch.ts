//lib/apiFetch

export type ApiError = { status: number; message: string };

const API_BASE = process.env.NEXT_PUBLIC_API;

let refreshing: Promise<boolean> | null = null;

// ✅ Identificador de app para separar cookies en backend
const CT_APP = "driver";

function isAuthPath(path: string) {
  return (
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/logout") ||
    path.startsWith("/auth/register")
  );
}

async function refreshSession(): Promise<boolean> {
  if (!API_BASE) return false;

  // evitar múltiples refresh simultáneos
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            // ✅ CLAVE: el backend usará ct_*_driver
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
  // 204 / vacío: no hay JSON
  if (res.status === 204) return undefined as T;

  const text = await res.text().catch(() => "");
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    // si el backend devuelve texto plano
    return text as unknown as T;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE) {
    throw { status: 0, message: "Falta NEXT_PUBLIC_API en .env.local" } satisfies ApiError;
  }

  const method = String(options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  // ✅ SIEMPRE mandar el header para que NO se crucen cookies con Buyer/Store
  if (!headers.has("x-ct-app")) {
    headers.set("x-ct-app", CT_APP);
  }

  // Solo setear Content-Type si realmente enviamos body (POST/PUT/PATCH)
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

  // 1er intento
  let res = await doFetch();

  // si no autorizado (401/403), intentamos refresh 1 vez (excepto rutas auth)
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