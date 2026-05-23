//app\(driver)\lib\driverIndependenceLegal.ts
import { apiFetch } from "../../../lib/apiFetch";
import { DRIVER_INDEPENDENCE_VERSION } from "../legal/driverIndependence";

const DRIVER_INDEPENDENCE_DOCUMENT_TYPE =
  "DRIVER_INDEPENDENCE_AGREEMENT";

export const DRIVER_INDEPENDENCE_LOCAL_KEY =
  "kronix_driver_independence_acceptance";

export function saveDriverIndependenceLocal() {
  try {
    localStorage.setItem(
      DRIVER_INDEPENDENCE_LOCAL_KEY,
      JSON.stringify({
        documentType: DRIVER_INDEPENDENCE_DOCUMENT_TYPE,
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

    return (
      parsed?.documentType === DRIVER_INDEPENDENCE_DOCUMENT_TYPE &&
      parsed?.version === DRIVER_INDEPENDENCE_VERSION
    );
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
      `/legal/status?documentType=${DRIVER_INDEPENDENCE_DOCUMENT_TYPE}&version=${encodeURIComponent(
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

    return false;
  } catch {
    return hasDriverIndependenceLocal();
  }
}

export async function acceptDriverIndependenceBackend() {
  await apiFetch("/legal/accept", {
    method: "POST",
    body: JSON.stringify({
      documentType: DRIVER_INDEPENDENCE_DOCUMENT_TYPE,
      version: DRIVER_INDEPENDENCE_VERSION,
      source: "DRIVER_APP",
    }),
  });

  saveDriverIndependenceLocal();
}