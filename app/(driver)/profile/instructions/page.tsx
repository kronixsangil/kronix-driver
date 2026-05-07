//app\(driver)\profile\instructions\page.tsx
"use client";

import { useState } from "react";
import { useDriverCity } from "../../components/DriverCityContext";

export default function DriverInstructionsPage() {
  const { cityLabel, cityName, loading: cityLoading } = useDriverCity();
  const cityText = cityLoading ? "tu ciudad operativa" : cityLabel || cityName || "tu ciudad operativa";

  const GUIDES = [
    {
      title: "Proceso de recogida en tienda",
      content: `
1. Llega puntual al establecimiento.
2. Preséntate como conductor KroniX.
3. Verifica que el pedido coincida con la orden en la app.
4. Confirma recogida solo cuando el pedido esté completo.
      `,
    },
    {
      title: "Entrega al cliente",
      content: `
1. Dirígete directamente a la ubicación.
2. Comunícate si no encuentras la dirección.
3. Entrega el pedido en buen estado.
4. Marca como entregado solo cuando finalice la entrega.
      `,
    },
    {
      title: `Operación en ${cityText}`,
      content: `
• Opera únicamente bajo la ciudad asignada en tu sesión.
• Los pedidos visibles corresponden a tu ciudad operativa.
• Si detectas una inconsistencia de ciudad, contacta soporte antes de aceptar pedidos.
      `,
    },
    {
      title: "Manejo de pagos",
      content: `
• Los pagos digitales se procesan automáticamente.
• Nunca aceptes pagos fuera de la app.
      `,
    },
    {
      title: "Qué hacer en caso de incidente",
      content: `
• Mantén la calma.
• Contacta soporte inmediatamente.
• No canceles sin autorización.
• Documenta lo ocurrido.
      `,
    },
    {
      title: "Buenas prácticas para subir de nivel",
      content: `
• Mantén alta tasa de entregas.
• Evita cancelaciones.
• Mantén comunicación respetuosa.
• Cumple tiempos de entrega.
      `,
    },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="w-full bg-slate-50">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-5">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">Instructivo</h1>
          <p className="mt-1 text-sm text-gray-600">Manual oficial del conductor</p>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {cityLoading ? "Cargando ciudad..." : cityLabel || cityName || "Ciudad no asignada"}
          </div>
        </div>

        {GUIDES.map((g, i) => (
          <div
            key={g.title}
            className="rounded-3xl border border-gray-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full px-5 py-4 text-left"
            >
              <div className="flex justify-between items-center gap-3">
                <div className="text-sm font-extrabold text-gray-900">{g.title}</div>
                <div className="text-gray-400 shrink-0">{open === i ? "−" : "+"}</div>
              </div>
            </button>

            {open === i && (
              <div className="px-5 pb-5 text-xs text-gray-700 whitespace-pre-line">
                {g.content}
              </div>
            )}
          </div>
        ))}

        <div className="text-center text-[11px] text-gray-500">
          Instructivo alineado con operación multiciudad. ✅
        </div>
      </div>
    </div>
  );
}