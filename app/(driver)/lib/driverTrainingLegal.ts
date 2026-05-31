//app\(driver)\lib\driverTrainingLegal.ts
import { apiFetch } from "../../../lib/apiFetch";
import { getCurrentDriverLegalDocument } from "./driverPrivacyLegal";

export type DriverTrainingType =
  | "OPERATIONAL_SECURITY"
  | "ANTI_FRAUD"
  | "ACADEMY_WELCOME"
  | "ACADEMY_ROAD_SAFETY"
  | "ACADEMY_APP_OPERATION"
  | "ACADEMY_FRAUD_PREVENTION";

export type DriverTrainingDocumentType =
  | "DRIVER_OPERATIONAL_SECURITY_MANUAL"
  | "DRIVER_ANTI_FRAUD_POLICY";

export const DRIVER_OPERATIONAL_SECURITY_FALLBACK_VERSION =
  "driver-operational-security-v1-2026-05-21";

export const DRIVER_ANTI_FRAUD_FALLBACK_VERSION =
  "driver-anti-fraud-v1-2026-05-21";

export async function getCurrentDriverTrainingDocument(
  documentType: DriverTrainingDocumentType
) {
  return getCurrentDriverLegalDocument(documentType);
}

export async function getCurrentDriverTrainingDocumentVersion(
  documentType: DriverTrainingDocumentType
) {
  const doc = await getCurrentDriverTrainingDocument(documentType);

  if (doc?.version) return doc.version;

  if (documentType === "DRIVER_OPERATIONAL_SECURITY_MANUAL") {
    return DRIVER_OPERATIONAL_SECURITY_FALLBACK_VERSION;
  }

  return DRIVER_ANTI_FRAUD_FALLBACK_VERSION;
}

export async function checkDriverTrainingStatus(
  trainingType: DriverTrainingType,
  version: string
) {
  const res = await apiFetch<{
    ok: boolean;
    passed: boolean;
    latestAttempt?: any;
  }>(
    `/legal/driver-training/status?trainingType=${trainingType}&version=${encodeURIComponent(
      version
    )}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return {
    passed: !!res?.passed,
    latestAttempt: res?.latestAttempt ?? null,
  };
}

export async function submitDriverTrainingQuiz(input: {
  trainingType: DriverTrainingType;
  version: string;
  answers: {
    questionId: string;
    selectedOptionId: string;
  }[];
}) {
  return apiFetch<{
    ok: boolean;
    passed: boolean;
    passingScore: number;
    scorePercent: number;
    correctAnswers: number;
    totalQuestions: number;
    attempt: any;
  }>("/legal/driver-training/quiz", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function acceptDriverTrainingDocument(input: {
  documentType: DriverTrainingDocumentType;
  version?: string;
}) {
  const finalVersion =
    input.version ||
    (await getCurrentDriverTrainingDocumentVersion(input.documentType));

  return apiFetch("/legal/accept", {
    method: "POST",
    body: JSON.stringify({
      documentType: input.documentType,
      version: finalVersion,
      source: "DRIVER_APP",
    }),
  });
}