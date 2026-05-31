//app\(driver)\lib\driverPrivacyLegal.ts
import { apiFetch } from "../../../lib/apiFetch";

export const DRIVER_PRIVACY_DOCUMENT_TYPE = "DRIVER_PRIVACY";
export const DRIVER_PRIVACY_FALLBACK_VERSION = "driver-privacy-v1-2026-05-21";
export const DRIVER_PRIVACY_LOCAL_KEY = "kronix_driver_privacy_acceptance";

export type DriverLegalDocument = {
  id: string;
  documentType: string;
  version: string;
  title: string;
  description?: string | null;
  content?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function getCurrentDriverLegalDocument(documentType: string) {
  const res = await apiFetch<{
    ok: boolean;
    documentType: string;
    document: DriverLegalDocument | null;
  }>(`/legal/documents/current/${documentType}`, {
    method: "GET",
    cache: "no-store",
  });

  return res.document;
}

export async function getCurrentDriverPrivacyVersion() {
  const doc = await getCurrentDriverLegalDocument(DRIVER_PRIVACY_DOCUMENT_TYPE);
  return doc?.version || DRIVER_PRIVACY_FALLBACK_VERSION;
}

export function saveDriverPrivacyLocal(version: string) {
  try {
    localStorage.setItem(
      DRIVER_PRIVACY_LOCAL_KEY,
      JSON.stringify({
        documentType: DRIVER_PRIVACY_DOCUMENT_TYPE,
        version,
        acceptedAt: new Date().toISOString(),
      })
    );
  } catch {}
}

export function hasDriverPrivacyLocal(version?: string) {
  try {
    const raw = localStorage.getItem(DRIVER_PRIVACY_LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed?.version) return false;

    if (version) {
      return parsed.version === version;
    }

    return parsed.documentType === DRIVER_PRIVACY_DOCUMENT_TYPE || !!parsed.version;
  } catch {
    return false;
  }
}

export async function checkDriverPrivacyStatus() {
  const version = await getCurrentDriverPrivacyVersion();

  const res = await apiFetch<{ ok: boolean; accepted: boolean }>(
    `/legal/status?documentType=${DRIVER_PRIVACY_DOCUMENT_TYPE}&version=${encodeURIComponent(
      version
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (res?.accepted) saveDriverPrivacyLocal(version);

  return !!res?.accepted;
}

export async function acceptDriverPrivacyBackend(version?: string) {
  const finalVersion = version || (await getCurrentDriverPrivacyVersion());

  await apiFetch("/legal/accept", {
    method: "POST",
    body: JSON.stringify({
      documentType: DRIVER_PRIVACY_DOCUMENT_TYPE,
      version: finalVersion,
      source: "DRIVER_APP",
    }),
  });

  saveDriverPrivacyLocal(finalVersion);
}