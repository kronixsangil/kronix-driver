//app\(driver)\profile\components\DriverTrainingCard.tsx
"use client";

import { useEffect, useState } from "react";
import type { DriverTrainingType } from "../../lib/driverTrainingLegal";
import { checkDriverTrainingStatus } from "../../lib/driverTrainingLegal";

type Props = {
  title: string;
  desc: string;
  href: string;
  trainingType: DriverTrainingType;
  version: string;
};

export default function DriverTrainingCard({
  title,
  desc,
  href,
  trainingType,
  version,
}: Props) {
  const [checking, setChecking] = useState(true);
  const [passed, setPassed] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setChecking(true);

      try {
        const res = await checkDriverTrainingStatus(trainingType, version);
        if (!mounted) return;

        setPassed(!!res.passed);
        setScore(
          typeof res.latestAttempt?.scorePercent === "number"
            ? res.latestAttempt.scorePercent
            : null
        );
      } catch {
        if (!mounted) return;
        setPassed(false);
        setScore(null);
      } finally {
        if (mounted) setChecking(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [trainingType, version]);

  return (
    <a
      href={href}
      className="mx-2 block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Capacitación KroniX
          </div>

          <div className="mt-1 text-base font-extrabold text-gray-900">
            {title}
          </div>

          <div className="mt-1 text-[12px] text-gray-600">{desc}</div>

          {score != null ? (
            <div className="mt-2 text-[11px] font-bold text-slate-500">
              Último puntaje: {score}%
            </div>
          ) : null}
        </div>

        <div
          className={`rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${
            checking
              ? "bg-slate-50 text-slate-600 ring-slate-100"
              : passed
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-amber-50 text-amber-700 ring-amber-100"
          }`}
        >
          {checking ? "..." : passed ? "Aprobado" : "Pendiente"}
        </div>
      </div>
    </a>
  );
}