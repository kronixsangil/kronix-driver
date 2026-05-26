//app\(driver)\profile\academy\page.tsx
"use client";

import Link from "next/link";

type AcademyModule = {
  id: string;
  title: string;
  desc: string;
  href: string;
  icon: string;
  duration: string;
};

const MODULES: AcademyModule[] = [
  {
    id: "welcome",
    title: "Bienvenida KroniX",
    desc: "Cultura, trato al cliente, puntualidad y presentación.",
    href: "/profile/academy/welcome",
    icon: "👋",
    duration: "3 preguntas",
  },
  {
    id: "road-safety",
    title: "Seguridad Vial",
    desc: "Conducción segura, accidentes, zonas peligrosas y manejo defensivo.",
    href: "/profile/academy/road-safety",
    icon: "🛵",
    duration: "3 preguntas",
  },
  {
    id: "app-operation",
    title: "Operación App",
    desc: "Recogidas, entregas, pagos, soporte e incidentes.",
    href: "/profile/academy/app-operation",
    icon: "📲",
    duration: "3 preguntas",
  },
  {
    id: "fraud-prevention",
    title: "Antifraude",
    desc: "GPS falso, cuentas compartidas, robo, fraude y suplantación.",
    href: "/profile/academy/fraud-prevention",
    icon: "🔐",
    duration: "3 preguntas",
  },
];

export default function DriverAcademyPage() {
  const completed = 0;
  const total = MODULES.length;
  const pct = 0;

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
                📊 Progreso: {pct}%
              </div>
            </div>
          </div>
        </div>

        <div className="mx-0 mt-4 space-y-3">
          {MODULES.map((mod, index) => (
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

                    <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700 ring-1 ring-amber-100">
                      Pendiente
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                    <span>{mod.duration}</span>
                    <span className="font-black text-slate-900">
                      Ver capacitación ›
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
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