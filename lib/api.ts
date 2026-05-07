//lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API;

export type ApiError = { status: number; message: string };

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null
): Promise<T> {
  if (!API_BASE) throw { status: 0, message: "Falta NEXT_PUBLIC_API en .env.local" };

  const headers = new Headers(options.headers || {});
  // Solo forzamos JSON si no existe ya (evita problemas en casos raros)
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  // Soporte legacy por si alguna parte aún usa Bearer (no estorba)
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    // ✅ CLAVE para Auth real por cookies httpOnly
    credentials: "include",
    cache: options.cache ?? "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw { status: res.status, message: text || `Error ${res.status}` } satisfies ApiError;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const txt = await res.text().catch(() => "");
    return (txt as unknown) as T;
  }

  return (await res.json()) as T;
}
