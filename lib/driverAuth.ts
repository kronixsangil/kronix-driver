//lib/driverAuth.ts
import { apiFetch } from "./apiFetch";
import { refreshDriver } from "./driverAuthActions";

export type DriverStatus = "PENDIENTE" | "ACTIVO" | "INACTIVO" | "SUSPENDIDO";
export type DriverLevel = "BRONCE" | "PLATA" | "ORO" | "PLATINO";

export type AuthMePayload = {
  user: {
    sub: string;
    role: "BUYER" | "DRIVER" | "STORE" | "ADMIN" | string;
    phone?: string | null;
    email?: string | null;
    storeId?: string | null;
    storeCode?: string | null;
    iat?: number;
    exp?: number;
  };
};

export type DriverMeDTO = {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
};

export type DriverCityDTO = {
  id: string;
  slug: string;
  name: string;
  department?: string | null;
  country?: string | null;
  isActive?: boolean;
};

export type DriverAppMeResponse = {
  user: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    role?: string;
    nickname?: string | null;
  };
  driverProfile: {
    id: string;
    userId: string;
    level: "BRONCE" | "PLATA" | "ORO" | "PLATINO" | string;
    rating: number;
    isActive: boolean;
    documentId?: string | null;
    cityId?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  city: DriverCityDTO | null;
  quick?: {
    vehicleOk?: boolean | null;
    paymentOk?: boolean | null;
  };
};

export function clearSession() {
  // ✅ FASE 5: ya no persistimos auth en localStorage
}

export function readCachedUserId(): string {
  // ✅ FASE 5: sin cache persistente
  return "";
}

export function writeCachedUserId(_: string) {
  // ✅ FASE 5: no-op
}

export function readCachedMe(): AuthMePayload | null {
  // ✅ FASE 5: sin cache persistente
  return null;
}

export function writeCachedMe(_: AuthMePayload) {
  // ✅ FASE 5: no-op
}

function normalizeAuthPayload(anyResp: any): AuthMePayload | null {
  const u = anyResp?.user ?? anyResp;
  const sub = String(u?.sub ?? "").trim();
  if (!sub) return null;

  return {
    user: {
      sub,
      role: u?.role,
      phone: u?.phone ?? null,
      email: u?.email ?? null,
      storeId: u?.storeId ?? null,
      storeCode: u?.storeCode ?? null,
      iat: u?.iat,
      exp: u?.exp,
    },
  };
}

/**
 * ✅ Driver-first:
 * 1) intenta /drivers/me
 * 2) fallback a /auth/me
 */
export async function getMe(): Promise<AuthMePayload | null> {
  try {
    const out = await apiFetch<any>("/drivers/me", { method: "GET", cache: "no-store" });

    const userId = String(out?.user?.id ?? "").trim();
    const role = String(out?.user?.role ?? "").trim();

    if (userId) {
      return {
        user: {
          sub: userId,
          role: role || "DRIVER",
          phone: out?.user?.phone ?? null,
          email: out?.user?.email ?? null,
          storeId: null,
          storeCode: null,
        },
      };
    }
  } catch {
    // seguimos a fallback
  }

  try {
    const me = await apiFetch<any>("/auth/me", { method: "GET", cache: "no-store" });
    const normalized = normalizeAuthPayload(me);
    return normalized;
  } catch {
    return null;
  }
}

export type DriverMeResponse = {
  user: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    role?: string;
    nickname?: string | null;
  };
  driverProfile: {
    id: string;
    userId: string;
    level: "BRONCE" | "PLATA" | "ORO" | "PLATINO" | string;
    rating: number;
    isActive: boolean;
    documentId?: string | null;
    cityId?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  city: DriverCityDTO | null;
  quick?: {
    vehicleOk?: boolean | null;
    paymentOk?: boolean | null;
  };
};

export async function getDriverAppMe(): Promise<DriverAppMeResponse | null> {
  try {
    const out = await apiFetch<any>("/drivers/me", { method: "GET", cache: "no-store" });

    const user = out?.user;
    const driverProfile = out?.driverProfile;
    const city = out?.city ?? null;

    const id = String(user?.id ?? "").trim();
    const name = String(user?.name ?? "").trim();

    if (!id || !name || !driverProfile) return null;

    return {
      user: {
        id,
        name,
        phone: user?.phone ?? null,
        email: user?.email ?? null,
        role: user?.role,
        nickname: user?.nickname ?? null,
      },
      driverProfile: {
        id: String(driverProfile?.id ?? ""),
        userId: String(driverProfile?.userId ?? ""),
        level: driverProfile?.level,
        rating: Number(driverProfile?.rating ?? 0),
        isActive: Boolean(driverProfile?.isActive),
        documentId: driverProfile?.documentId ?? null,
        cityId: driverProfile?.cityId ?? null,
        createdAt: driverProfile?.createdAt,
        updatedAt: driverProfile?.updatedAt,
      },
      city: city
        ? {
            id: String(city?.id ?? ""),
            slug: String(city?.slug ?? ""),
            name: String(city?.name ?? ""),
            department: city?.department ?? null,
            country: city?.country ?? null,
            isActive: city?.isActive ?? true,
          }
        : null,
      quick: out?.quick
        ? {
            vehicleOk: out?.quick?.vehicleOk ?? null,
            paymentOk: out?.quick?.paymentOk ?? null,
          }
        : undefined,
    };
  } catch {
    return null;
  }
}

export async function getDriverMe(): Promise<DriverMeResponse | null> {
  try {
    const out = await getDriverAppMe();
    if (!out) return null;

    return {
      user: out.user,
      driverProfile: out.driverProfile,
      city: out.city,
      quick: out.quick,
    };
  } catch {
    return null;
  }
}

export async function ensureDriverSession(): Promise<{
  ok: boolean;
  me: AuthMePayload | null;
  reason?: "NO_SESSION" | "NOT_DRIVER";
}> {
  let me = await getMe();
  let role = String(me?.user?.role ?? "").toUpperCase();

  if (me?.user?.sub && role === "DRIVER") {
    return { ok: true, me };
  }

  if (!me?.user?.sub) {
    try {
      await refreshDriver();
    } catch {}

    me = await getMe();
    role = String(me?.user?.role ?? "").toUpperCase();

    if (me?.user?.sub && role === "DRIVER") {
      return { ok: true, me };
    }
  }

  if (!me?.user?.sub) {
    clearSession();
    return { ok: false, me: null, reason: "NO_SESSION" };
  }

  if (role !== "DRIVER") {
    return { ok: false, me, reason: "NOT_DRIVER" };
  }

  return { ok: true, me };
}

export async function ensureUserId(): Promise<string> {
  const me = await getMe();
  return String(me?.user?.sub ?? "").trim();
}