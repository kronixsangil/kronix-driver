//app\(driver)\lib\driverPrivacyLegal.ts
import { apiFetch } from "../../../lib/apiFetch";
import { DRIVER_PRIVACY_VERSION } from "../legal/driverPrivacy";

export const DRIVER_PRIVACY_LOCAL_KEY = "kronix_driver_privacy_acceptance";

export function saveDriverPrivacyLocal() {
  try {
    localStorage.setItem(
      DRIVER_PRIVACY_LOCAL_KEY,
      JSON.stringify({
        version: DRIVER_PRIVACY_VERSION,
        acceptedAt: new Date().toISOString(),
      })
    );
  } catch {}
}

export function hasDriverPrivacyLocal() {
  try {
    const raw = localStorage.getItem(DRIVER_PRIVACY_LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.version === DRIVER_PRIVACY_VERSION;
  } catch {
    return false;
  }
}

export async function checkDriverPrivacyStatus() {
  const res = await apiFetch<{ ok: boolean; accepted: boolean }>(
    `/legal/status?documentType=DRIVER_PRIVACY&version=${encodeURIComponent(
      DRIVER_PRIVACY_VERSION
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (res?.accepted) saveDriverPrivacyLocal();

  return !!res?.accepted;
}

export async function acceptDriverPrivacyBackend() {
  await apiFetch("/legal/accept", {
    method: "POST",
    body: JSON.stringify({
      documentType: "DRIVER_PRIVACY",
      version: DRIVER_PRIVACY_VERSION,
      source: "DRIVER_APP",
    }),
  });

  saveDriverPrivacyLocal();
}