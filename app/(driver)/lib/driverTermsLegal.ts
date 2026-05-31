//app\(driver)\lib\driverTermsLegal.ts
import { apiFetch } from "../../../lib/apiFetch";

export const DRIVER_TERMS_LOCAL_KEY = "kronix_driver_terms_acceptance";
export const DRIVER_TERMS_FALLBACK_VERSION = "driver-terms-v1-2026-05-21";

export type DriverLegalDocument = {
  id: string;
  documentType: "DRIVER_TERMS";
  version: string;
  title: string;
  description?: string | null;
  content?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function getCurrentDriverTermsDocument() {
  const res = await apiFetch<{
    ok: boolean;
    documentType: string;
    document: DriverLegalDocument | null;
  }>("/legal/documents/current/DRIVER_TERMS", {
    method: "GET",
    cache: "no-store",
  });

  return res.document;
}

export async function getCurrentDriverTermsVersion() {
  const doc = await getCurrentDriverTermsDocument();
  return doc?.version || DRIVER_TERMS_FALLBACK_VERSION;
}

export function saveDriverTermsLocal(version: string) {
  try {
    localStorage.setItem(
      DRIVER_TERMS_LOCAL_KEY,
      JSON.stringify({
        version,
        acceptedAt: new Date().toISOString(),
      })
    );
  } catch {}
}

export function hasDriverTermsLocal(version: string) {
  try {
    const raw = localStorage.getItem(DRIVER_TERMS_LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.version === version;
  } catch {
    return false;
  }
}

export async function checkDriverTermsStatus() {
  const version = await getCurrentDriverTermsVersion();

  const res = await apiFetch<{ ok: boolean; accepted: boolean }>(
    `/legal/status?documentType=DRIVER_TERMS&version=${encodeURIComponent(
      version
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (res?.accepted) {
    saveDriverTermsLocal(version);
  }

  return !!res?.accepted;
}

export async function acceptDriverTermsBackend(version: string) {
  await apiFetch("/legal/accept", {
    method: "POST",
    body: JSON.stringify({
      documentType: "DRIVER_TERMS",
      version,
      source: "DRIVER_APP",
    }),
  });

  saveDriverTermsLocal(version);
}