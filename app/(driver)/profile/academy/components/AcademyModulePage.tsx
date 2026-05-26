//app\(driver)\profile\academy\components\AcademyModulePage.tsx
"use client";

import { useMemo, useState } from "react";
import {
  submitDriverTrainingQuiz,
  type DriverTrainingType,
} from "../../../lib/driverTrainingLegal";

type QuizQuestion = {
  id: string;
  question: string;
  options: { id: string; label: string; correct?: boolean }[];
};

type Props = {
  title: string;
  subtitle: string;
  icon: string;
  videoTitle: string;
  videoUrl?: string;
  checklist: string[];
  quiz: QuizQuestion[];
  version: string;
  trainingType: DriverTrainingType;
};

export default function AcademyModulePage({
  title,
  subtitle,
  icon,
  videoTitle,
  videoUrl,
  version,
  trainingType,
  checklist,
  quiz,
}: Props) {
  const [videoChecked, setVideoChecked] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const checklistDone = checklist.every((item) => checkedItems[item]);
  const allAnswered = quiz.every((q) => !!answers[q.id]);

  const score = useMemo(() => {
    const correct = quiz.filter((q) => {
      const selected = answers[q.id];
      return q.options.some((opt) => opt.id === selected && opt.correct);
    }).length;

    return {
      correct,
      total: quiz.length,
      pct: quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 0,
    };
  }, [answers, quiz]);

  const canSubmit = videoChecked && checklistDone && allAnswered;

  async function handleSubmit() {
    if (!canSubmit || saving) return;

    setSaving(true);

    try {
      const res = await submitDriverTrainingQuiz({
        trainingType,
        version,
        answers: quiz.map((q) => ({
          questionId: q.id,
          selectedOptionId: answers[q.id],
        })),
      });

      setSubmitted(true);

      if (res?.passed) {
        alert(
          `Capacitación registrada correctamente. Puntaje: ${res.scorePercent}%.`
        );
        window.location.href = "/profile/academy";
        return;
      }

      alert(
        `No aprobaste todavía. Puntaje: ${
          res?.scorePercent ?? score.pct
        }%. Puedes intentarlo de nuevo.`
      );
    } catch (e: any) {
      alert(e?.message || "No fue posible guardar la capacitación.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0">
        <div className="mx-0 overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50">
          <div className="flex items-start gap-4 p-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-100 bg-white text-2xl">
              {icon}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-black leading-6 text-slate-950">
                {title}
              </h1>

              <div className="mt-3 inline-flex rounded-full border border-emerald-100 bg-white px-3 py-1 text-[11px] font-black text-slate-700">
                📘 Versión: {version}
              </div>

              <div className="mt-2 inline-flex rounded-full border border-emerald-100 bg-white px-3 py-1 text-[11px] font-black text-slate-700">
                🎓 Academia KroniX
              </div>
            </div>
          </div>
        </div>

        <div className="mx-0 mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-slate-900">{videoTitle}</div>

          <p className="mt-2 text-xs leading-5 text-slate-600">{subtitle}</p>

          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
            {videoUrl ? (
              <iframe
                className="aspect-video w-full"
                src={videoUrl}
                title={videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex aspect-video items-center justify-center px-6 text-center text-xs font-bold text-white">
                Aquí irá el video de capacitación KroniX.
              </div>
            )}
          </div>

          <label className="mt-3 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={videoChecked}
              onChange={(e) => setVideoChecked(e.target.checked)}
              className="mt-1 h-4 w-4 accent-emerald-600"
            />
            <span className="text-xs font-semibold leading-5 text-slate-700">
              Confirmo que vi y entendí este video.
            </span>
          </label>
        </div>

        <div className="mx-0 mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-slate-900">
            Checklist rápido
          </div>

          <div className="mt-3 space-y-2">
            {checklist.map((item) => (
              <label
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <input
                  type="checkbox"
                  checked={!!checkedItems[item]}
                  onChange={(e) =>
                    setCheckedItems((prev) => ({
                      ...prev,
                      [item]: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 accent-emerald-600"
                />
                <span className="text-xs font-semibold leading-5 text-slate-700">
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mx-0 mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-slate-900">Quiz corto</div>

          <div className="mt-3 space-y-4">
            {quiz.map((q, index) => (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="text-xs font-black text-slate-900">
                  {index + 1}. {q.question}
                </div>

                <div className="mt-3 space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={answers[q.id] === opt.id}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        className="mt-0.5 accent-emerald-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {submitted ? (
            <div
              className={[
                "mt-4 rounded-2xl border p-3 text-xs font-black",
                score.pct >= 80
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-900",
              ].join(" ")}
            >
              Resultado: {score.pct}% · {score.correct}/{score.total} correctas.
            </div>
          ) : null}

          <button
            type="button"
            disabled={!canSubmit || saving}
            onClick={handleSubmit}
            className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black text-white ${
              canSubmit && !saving ? "bg-emerald-600" : "bg-slate-300"
            }`}
          >
            {saving ? "Guardando..." : "Enviar capacitación"}
          </button>
        </div>
      </div>
    </div>
  );
}