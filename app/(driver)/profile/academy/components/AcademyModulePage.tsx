//app\(driver)\profile\academy\components\AcademyModulePage.tsx
"use client";

import { useMemo, useState } from "react";

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
};

export default function AcademyModulePage({
  title,
  subtitle,
  icon,
  videoTitle,
  videoUrl,
  checklist,
  quiz,
}: Props) {
  const [videoChecked, setVideoChecked] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

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

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
  }

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-4">
        <div className="mx-2 overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-950 p-5 text-white shadow-xl">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">
            KroniX Driver Academy
          </div>

          <div className="mt-3 flex items-start gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-3xl">
              {icon}
            </div>

            <div>
              <h1 className="text-2xl font-black leading-7">{title}</h1>
              <p className="mt-2 text-sm font-medium leading-5 text-emerald-50">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-slate-900">{videoTitle}</div>

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

        <div className="mx-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-slate-900">Checklist rápido</div>

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

        <div className="mx-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-slate-900">Quiz corto</div>

          <div className="mt-3 space-y-4">
            {quiz.map((q, index) => (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black text-white ${
              canSubmit ? "bg-emerald-600" : "bg-slate-300"
            }`}
          >
            Enviar capacitación
          </button>
        </div>
      </div>
    </div>
  );
}