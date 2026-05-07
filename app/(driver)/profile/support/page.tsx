//app\(driver)\profile\support\page.tsx
"use client";

import { useDriverCity } from "../../components/DriverCityContext";

export default function DriverSupportPage() {
  const { cityLabel, cityName, loading: cityLoading } = useDriverCity();

  const phone = "+573112461059";
  const whatsappUrl = `https://wa.me/${phone.replace("+", "")}`;
  const callUrl = `tel:${phone}`;
  const cityText = cityLoading ? "tu ciudad operativa" : cityLabel || cityName || "tu ciudad operativa";

  return (
    <div className="w-full bg-slate-50">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-5">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">Soporte</h1>
          <p className="mt-1 text-sm text-gray-600">Ayuda y contacto</p>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {cityLoading ? "Cargando ciudad..." : cityLabel || cityName || "Ciudad no asignada"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Cobertura actual</div>
          <div className="mt-1 text-sm font-extrabold text-slate-900">{cityText}</div>
          <div className="mt-1 text-[12px] text-slate-600">
            Si reportas una incidencia, incluye siempre la ciudad operativa y el ID del pedido.
          </div>
        </div>

        <a
          href={callUrl}
          className="block rounded-3xl border border-red-200 bg-red-50 p-5 shadow-[0_12px_30px_rgba(239,68,68,0.25)]"
        >
          <div className="text-sm font-extrabold text-red-800">🚨 Emergencia en entrega</div>
          <div className="mt-1 text-xs text-red-700">
            Contacta inmediatamente si ocurre un incidente durante una entrega activa.
          </div>
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-green-100 text-green-600 text-xl font-bold">
              WA
            </div>
            <div>
              <div className="text-sm font-extrabold text-gray-900">WhatsApp</div>
              <div className="text-xs text-gray-600">Escríbenos al {phone}</div>
            </div>
          </div>
        </a>

        <a
          href={callUrl}
          className="block rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xl font-bold">
              📞
            </div>
            <div>
              <div className="text-sm font-extrabold text-gray-900">Llamada directa</div>
              <div className="text-xs text-gray-600">Llámanos al {phone}</div>
            </div>
          </div>
        </a>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.10)]">
          <div className="text-xs text-gray-600">Horario de atención: 8:00 a.m. – 6:00 p.m.</div>
          <div className="text-xs text-gray-500">Zona horaria Colombia</div>
          <div className="mt-2 text-xs text-gray-500">
            Recomendación: al contactar soporte, menciona tu ciudad operativa actual:{" "}
            <span className="font-semibold text-gray-700">{cityText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}