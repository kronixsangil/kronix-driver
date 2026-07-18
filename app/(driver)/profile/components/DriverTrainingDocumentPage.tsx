//app\(driver)\profile\components\DriverTrainingDocumentPage.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import {
  acceptDriverTrainingDocument,
  submitDriverTrainingQuiz,
  type DriverTrainingType,
} from "../../lib/driverTrainingLegal";

type QuizQuestion = {
  id: string;
  question: string;
  options: {
    id: string;
    label: string;
  }[];
};

type Props = {
  title: string;
  version: string;
  lastUpdated: string;
  text: string;
  trainingType: DriverTrainingType;
  documentType:
    | "DRIVER_OPERATIONAL_SECURITY_MANUAL"
    | "DRIVER_ANTI_FRAUD_POLICY";
  quiz: QuizQuestion[];
};

export default function DriverTrainingDocumentPage({
  title,
  version,
  lastUpdated,
  text,
  trainingType,
  documentType,
  quiz,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [reachedBottom, setReachedBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    scorePercent: number;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);

  const paragraphs = useMemo(
    () => text.split("\n").filter((line) => line.trim().length > 0),
    [text]
  );

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setReachedBottom(true);
    }
  }

  const allAnswered = quiz.every((q) => !!answers[q.id]);
  const canSubmit = reachedBottom && checked && allAnswered && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setResult(null);

    try {
      const quizResult = await submitDriverTrainingQuiz({
        trainingType,
        version,
        answers: quiz.map((q) => ({
          questionId: q.id,
          selectedOptionId: answers[q.id],
        })),
      });

      setResult({
        passed: quizResult.passed,
        scorePercent: quizResult.scorePercent,
        correctAnswers: quizResult.correctAnswers,
        totalQuestions: quizResult.totalQuestions,
      });

      if (!quizResult.passed) {
        alert(
          `No aprobaste todavía. Puntaje: ${quizResult.scorePercent}%. Debes obtener mínimo ${quizResult.passingScore}%. Puedes intentarlo de nuevo.`
        );
        return;
      }

      await acceptDriverTrainingDocument({
        documentType,
        version,
      });

      alert(
        `Capacitación aprobada y registrada correctamente. Puntaje: ${quizResult.scorePercent}%.`
      );

      window.location.href = "/profile";
    } catch (e: any) {
      alert(e?.message || "No fue posible registrar la capacitación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-4">
        <div className="mx-2 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-emerald-100 bg-emerald-50 px-4 pb-3 pt-4">
            <div className="flex items-start gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-100 bg-white text-2xl">
                🛡️
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-[18px] font-black leading-5 text-slate-950">
                  {title}
                </h1>

                <div className="mt-3 flex flex-col gap-1.5">
                  <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-700 ring-1 ring-emerald-100">
                    📄 Versión: {version}
                  </span>

                  <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-700 ring-1 ring-emerald-100">
                    📅 Actualizado: {lastUpdated}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-[46dvh] overflow-y-auto px-4 py-4 text-[12.5px] leading-5 text-slate-700 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {paragraphs.map((p, index) => {
              const clean = p.replace(/^#+\s?/, "").trim();

              const isTitle =
                /^[0-9]+[\.\)]\s/.test(clean) ||
                (clean.length < 90 && clean.toUpperCase() === clean);

              const isBullet = clean.startsWith("•") || clean.startsWith("-");

              return (
                <p
                  key={`${clean}-${index}`}
                  className={
                    isTitle
                      ? "mb-3 mt-5 text-[14px] font-black leading-5 text-slate-950 first:mt-0"
                      : isBullet
                        ? "mb-1.5 pl-2 text-[12.5px] font-semibold leading-5 text-slate-600"
                        : "mb-3 text-[12.5px] font-medium leading-5 text-slate-700"
                  }
                >
                  {clean}
                </p>
              );
            })}

            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-black text-emerald-800">
              ✅ Has llegado al final del documento. Ahora completa el quiz.
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3">
            {!reachedBottom ? (
              <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-[11px] font-black leading-4 text-emerald-800">
                Desplázate hasta el final para habilitar el quiz.
              </div>
            ) : null}

            <label
              className={[
                "flex items-start gap-3 rounded-2xl border p-3",
                reachedBottom
                  ? "border-slate-200 bg-white"
                  : "border-slate-200 bg-slate-50 opacity-60",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!reachedBottom}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-1 h-4 w-4 accent-emerald-600"
              />

              <span className="text-[11.5px] font-semibold leading-5 text-slate-700">
                Declaro que he leído, comprendido y acepto aplicar este contenido operativo como trabajador KroniX.
              </span>
            </label>

            <div className="mt-4 space-y-4">
              <div className="text-sm font-black text-slate-900">
                Quiz obligatorio
              </div>

              {quiz.map((q, index) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="text-[12px] font-black text-slate-900">
                    {index + 1}. {q.question}
                  </div>

                  <div className="mt-3 space-y-2">
                    {q.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-[12px] font-semibold text-slate-700"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={option.id}
                          checked={answers[q.id] === option.id}
                          disabled={!reachedBottom || !checked || saving}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          className="mt-0.5 accent-emerald-600"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {result ? (
              <div
                className={[
                  "mt-4 rounded-2xl border p-3 text-xs font-black",
                  result.passed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-900",
                ].join(" ")}
              >
                Resultado: {result.scorePercent}% · {result.correctAnswers}/
                {result.totalQuestions} correctas ·{" "}
                {result.passed ? "Aprobado" : "No aprobado"}
              </div>
            ) : null}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black text-white ${
                canSubmit ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              {saving ? "Validando..." : "Enviar quiz y registrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}