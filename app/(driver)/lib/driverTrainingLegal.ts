//app\(driver)\lib\driverTrainingLegal.ts
import { apiFetch } from "../../../lib/apiFetch";

export type DriverTrainingType =
  | "OPERATIONAL_SECURITY"
  | "ANTI_FRAUD"
  | "ACADEMY_WELCOME"
  | "ACADEMY_ROAD_SAFETY"
  | "ACADEMY_APP_OPERATION"
  | "ACADEMY_FRAUD_PREVENTION";

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
  documentType:
    | "DRIVER_OPERATIONAL_SECURITY_MANUAL"
    | "DRIVER_ANTI_FRAUD_POLICY";
  version: string;
}) {
  return apiFetch("/legal/accept", {
    method: "POST",
    body: JSON.stringify({
      documentType: input.documentType,
      version: input.version,
      source: "DRIVER_APP",
    }),
  });
}