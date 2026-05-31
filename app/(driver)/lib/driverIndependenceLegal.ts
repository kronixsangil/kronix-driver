//app\(driver)\lib\driverIndependenceLegal.ts
import { apiFetch } from "../../../lib/apiFetch";
import {
  getCurrentDriverLegalDocument,
  type DriverLegalDocument,
} from "./driverPrivacyLegal";

export const DRIVER_INDEPENDENCE_DOCUMENT_TYPE =
  "DRIVER_INDEPENDENCE_AGREEMENT";

export const DRIVER_INDEPENDENCE_FALLBACK_VERSION =
  "driver-independence-agreement-v1-2026-05-21";

export const DRIVER_INDEPENDENCE_LOCAL_KEY =
  "kronix_driver_independence_acceptance";

export type { DriverLegalDocument };

export async function getCurrentDriverIndependenceDocument() {
  return getCurrentDriverLegalDocument(DRIVER_INDEPENDENCE_DOCUMENT_TYPE);
}

export async function getCurrentDriverIndependenceVersion() {
  const doc = await getCurrentDriverIndependenceDocument();
  return doc?.version || DRIVER_INDEPENDENCE_FALLBACK_VERSION;
}

export function saveDriverIndependenceLocal(version: string) {
  try {
    localStorage.setItem(
      DRIVER_INDEPENDENCE_LOCAL_KEY,
      JSON.stringify({
        documentType: DRIVER_INDEPENDENCE_DOCUMENT_TYPE,
        version,
        acceptedAt: new Date().toISOString(),
      })
    );
  } catch {}
}

export function hasDriverIndependenceLocal(version?: string) {
  try {
    const raw = localStorage.getItem(DRIVER_INDEPENDENCE_LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed?.version) return false;

    if (version) {
      return (
        parsed.documentType === DRIVER_INDEPENDENCE_DOCUMENT_TYPE &&
        parsed.version === version
      );
    }

    return parsed.documentType === DRIVER_INDEPENDENCE_DOCUMENT_TYPE;
  } catch {
    return false;
  }
}

export async function checkDriverIndependenceStatus() {
  const version = await getCurrentDriverIndependenceVersion();

  const res = await apiFetch<{
    ok: boolean;
    accepted: boolean;
  }>(
    `/legal/status?documentType=${DRIVER_INDEPENDENCE_DOCUMENT_TYPE}&version=${encodeURIComponent(
      version
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (res?.accepted) {
    saveDriverIndependenceLocal(version);
  }

  return !!res?.accepted;
}

export async function acceptDriverIndependenceBackend(version?: string) {
  const finalVersion =
    version || (await getCurrentDriverIndependenceVersion());

  await apiFetch("/legal/accept", {
    method: "POST",
    body: JSON.stringify({
      documentType: DRIVER_INDEPENDENCE_DOCUMENT_TYPE,
      version: finalVersion,
      source: "DRIVER_APP",
    }),
  });

  saveDriverIndependenceLocal(finalVersion);
}