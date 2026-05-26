//app\(driver)\profile\academy\page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  checkDriverTrainingStatus,
  type DriverTrainingType,
} from "../../lib/driverTrainingLegal";

type AcademyModule = {
  id: string;
  title: string;
  href: string;
  icon: string;
  duration: string;
  version: string;
  trainingType: DriverTrainingType;
};

const MODULES: AcademyModule[] = [
  {
    id: "welcome",
    title: "Bienvenida KroniX",
    href: "/profile/academy/welcome",
    icon: "👋",
    duration: "3 preguntas",
    version: "academy-welcome-v1",
    trainingType: "ACADEMY_WELCOME",
  },
  {
    id: "road-safety",
    title: "Seguridad Vial",
    href: "/profile/academy/road-safety",
    icon: "🛵",
    duration: "3 preguntas",
    version: "academy-road-safety-v1",
    trainingType: "ACADEMY_ROAD_SAFETY",
  },
  {
    id: "app-operation",
    title: "Operación App",
    href: "/profile/academy/app-operation",
    icon: "📲",
    duration: "3 preguntas",
    version: "academy-app-operation-v1",
    trainingType: "ACADEMY_APP_OPERATION",
  },
  {
    id: "fraud-prevention",
    title: "Antifraude",
    href: "/profile/academy/fraud-prevention",
    icon: "🔐",
    duration: "3 preguntas",
    version: "academy-fraud-prevention-v1",
    trainingType: "ACADEMY_FRAUD_PREVENTION",
  },
];

export default function DriverAcademyPage() {
  const [passedByModule, setPassedByModule] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadStatuses() {
      try {
        const results = await Promise.all(
          MODULES.map(async (mod) => {
            const status = await checkDriverTrainingStatus(
              mod.trainingType,
              mod.version
            );

            return [mod.id, !!status.passed] as const;
          })
        );

        if (!alive) return;

        setPassedByModule(Object.fromEntries(results));
      } catch {
        if (!alive) return;
        setPassedByModule({});
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    loadStatuses();

    return () => {
      alive = false;
    };
  }, []);

  const total = MODULES.length;

  const completed = useMemo(() => {
    return MODULES.filter((mod) => passedByModule[mod.id]).length;
  }, [passedByModule]);

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0">
        <div className="mx-0 overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50">
          <div className="flex items-start gap-4 p-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-100 bg-white text-2xl">
              🎓
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-black leading-6 text-slate-950">
                Academia KroniX para Conductores
              </h1>

              <div className="mt-2 inline-flex rounded-full border border-emerald-100 bg-white px-3 py-1 text-[13px] font-black text-slate-700">
                📊 Progreso: {loading ? "..." : `${pct}%`}
              </div>

              <div className="mt-2 inline-flex rounded-full border border-emerald-100 bg-white px-3 py-1 text-[11px] font-black text-slate-700">
                {loading
                  ? "Consultando módulos..."
                  : `${completed} de ${total} módulos aprobados`}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-0 mt-4 space-y-3">
          {MODULES.map((mod, index) => {
            const passed = !!passedByModule[mod.id];

            return (
              <Link
                key={mod.id}
                href={mod.href}
                className="block rounded-3xl border border-gray-200 bg-white p-4 shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl">
                    {mod.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                          Módulo {index + 1}
                        </div>

                        <div className="mt-1 text-base font-black text-gray-950">
                          {mod.title}
                        </div>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full px-3 py-1 text-[10px] font-black ring-1",
                          passed
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                            : "bg-amber-50 text-amber-700 ring-amber-100",
                        ].join(" ")}
                      >
                        {passed ? "Aprobado" : "Pendiente"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                      <span>{mod.duration}</span>
                      <span className="font-black text-slate-900">
                        {passed ? "Ver de nuevo ›" : "Ver capacitación ›"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mx-0 mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-xs font-black text-emerald-900">
            Meta del onboarding
          </div>
          <div className="mt-1 text-xs leading-5 text-emerald-900">
            Capacitar al conductor de forma rápida, clara y profesional mediante
            videos cortos y preguntas simples.
          </div>
        </div>
      </div>
    </div>
  );
}