//app\(driver)\lib\driverIndependenceLegal.ts
import { apiFetch } from "../../../lib/apiFetch";
import { DRIVER_INDEPENDENCE_VERSION } from "../legal/driverIndependence";

export const DRIVER_INDEPENDENCE_LOCAL_KEY =
  "kronix_driver_independence_acceptance";

export function saveDriverIndependenceLocal() {
  try {
    localStorage.setItem(
      DRIVER_INDEPENDENCE_LOCAL_KEY,
      JSON.stringify({
        version: DRIVER_INDEPENDENCE_VERSION,
        acceptedAt: new Date().toISOString(),
      })
    );
  } catch {}
}

export function hasDriverIndependenceLocal() {
  try {
    const raw = localStorage.getItem(DRIVER_INDEPENDENCE_LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    return parsed?.version === DRIVER_INDEPENDENCE_VERSION;
  } catch {
    return false;
  }
}

export async function checkDriverIndependenceStatus() {
  try {
    const res = await apiFetch<{
      ok: boolean;
      accepted: boolean;
    }>(
      `/legal/status?documentType=DRIVER_INDEPENDENCE&version=${encodeURIComponent(
        DRIVER_INDEPENDENCE_VERSION
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (res?.accepted) {
      saveDriverIndependenceLocal();
      return true;
    }

    return hasDriverIndependenceLocal();
  } catch {
    return hasDriverIndependenceLocal();
  }
}

export async function acceptDriverIndependenceBackend() {
  try {
    await apiFetch("/legal/accept", {
      method: "POST",
      body: JSON.stringify({
        documentType: "DRIVER_INDEPENDENCE",
        version: DRIVER_INDEPENDENCE_VERSION,
        source: "DRIVER_APP",
      }),
    });
  } catch {
    // Fallback temporal: guarda aceptación local para no bloquear el piloto
    // si el backend todavía no reconoce DRIVER_INDEPENDENCE.
  }

  saveDriverIndependenceLocal();
}
