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
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-4">
        <div className="mx-2 overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-950 p-5 text-white shadow-xl">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">
            KroniX Driver Academy
          </div>

          <h1 className="mt-2 text-2xl font-black leading-7">Academia KroniX</h1>

          <p className="mt-2 text-sm font-medium leading-5 text-emerald-50">
            Capacitación corta por videos para operar con seguridad, calidad y confianza.
          </p>

          <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-emerald-50">Progreso</span>
              <span className="font-black">{pct}%</span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
            </div>

            <div className="mt-2 text-xs font-semibold text-emerald-50">
              {completed} de {total} módulos completados
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {MODULES.map((mod, index) => (
            <Link
              key={mod.id}
              href={mod.href}
              className="mx-2 block rounded-3xl border border-gray-200 bg-white p-4 shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-2xl ring-1 ring-slate-200">
                  {mod.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                        Módulo {index + 1}
                      </div>

                      <div className="mt-1 text-base font-black text-gray-900">
                        {mod.title}
                      </div>

                      <div className="mt-1 text-xs leading-5 text-gray-600">
                        {mod.desc}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700 ring-1 ring-amber-100">
                      Pendiente
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                    <span>{mod.duration}</span>
                    <span className="font-black text-slate-900">Ver capacitación ›</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mx-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-xs font-black text-emerald-900">Meta del onboarding</div>
          <div className="mt-1 text-xs leading-5 text-emerald-900">
            Capacitar al conductor de forma rápida, clara y profesional mediante videos cortos y preguntas simples.
          </div>
        </div>
      </div>
    </div>
  );
}