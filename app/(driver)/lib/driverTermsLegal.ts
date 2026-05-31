//app\(driver)\lib\driverTermsLegal.ts
import { apiFetch } from "../../../lib/apiFetch";
import {
  getCurrentDriverLegalDocument,
  type DriverLegalDocument,
} from "./driverPrivacyLegal";

export const DRIVER_TERMS_DOCUMENT_TYPE = "DRIVER_TERMS";
export const DRIVER_TERMS_FALLBACK_VERSION = "driver-terms-v1-2026-05-21";
export const DRIVER_TERMS_LOCAL_KEY = "kronix_driver_terms_acceptance";

export type { DriverLegalDocument };

export async function getCurrentDriverTermsDocument() {
  return getCurrentDriverLegalDocument(DRIVER_TERMS_DOCUMENT_TYPE);
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
        documentType: DRIVER_TERMS_DOCUMENT_TYPE,
        version,
        acceptedAt: new Date().toISOString(),
      })
    );
  } catch {}
}

export async function checkDriverTermsStatus() {
  const version = await getCurrentDriverTermsVersion();

  const res = await apiFetch<{
    ok: boolean;
    accepted: boolean;
  }>(
    `/legal/status?documentType=${DRIVER_TERMS_DOCUMENT_TYPE}&version=${encodeURIComponent(
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

export async function acceptDriverTermsBackend(version?: string) {
  const finalVersion = version || (await getCurrentDriverTermsVersion());

  await apiFetch("/legal/accept", {
    method: "POST",
    body: JSON.stringify({
      documentType: DRIVER_TERMS_DOCUMENT_TYPE,
      version: finalVersion,
      source: "DRIVER_APP",
    }),
  });

  saveDriverTermsLocal(finalVersion);
}