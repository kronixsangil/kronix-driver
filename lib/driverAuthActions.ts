//lib/driverAuthActions.ts
"use client";

import { apiFetch } from "./apiFetch";
import { writeCachedMe, clearSession } from "./driverAuth";

function emitAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ct-auth-changed"));
  }
}

export async function loginDriver(emailOrPhone: string, password: string) {
  const body = {
    emailOrPhone: String(emailOrPhone ?? "").trim(),
    password: String(password ?? "").trim(),
  };

  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    cache: "no-store",
  });

  // cachea /auth/me
  try {
    const me = await apiFetch<any>("/auth/me", { method: "GET", cache: "no-store" });
    if (me?.user?.sub) writeCachedMe(me);
  } catch {}

  emitAuthChanged();
  return res;
}

export async function logoutDriver() {
  try {
    await apiFetch("/auth/logout", { method: "POST", cache: "no-store" });
  } catch {}

  clearSession();
  emitAuthChanged();
}

export async function refreshDriver() {
  const res = await apiFetch("/auth/refresh", { method: "POST", cache: "no-store" });

  try {
    const me = await apiFetch<any>("/auth/me", { method: "GET", cache: "no-store" });
    if (me?.user?.sub) writeCachedMe(me);
  } catch {}

  emitAuthChanged();
  return res;
}