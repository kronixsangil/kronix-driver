// app/(driver)/profile/cars/page.tsx
"use client";

import { apiFetch } from "../../../../lib/apiFetch";
import { useEffect, useMemo, useState } from "react";
import { useDriverCity } from "../../components/DriverCityContext";

type VehicleDTO = {
  id: string;
  brand: string;
  model: string;
  color: string;
  plate: string;
  soatNumber: string;
  soatExpiresAt: string;
  tecnicomecanicaNumber: string;
  tecnicomecanicaExpiresAt: string;
  isActive: boolean;
  updatedAt: string;
};

type LoadState = "loading" | "ok" | "empty" | "error";

function daysUntil(dateISO: string) {
  const now = new Date();
  const d = new Date(dateISO);
  const ms = d.getTime() - now.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function fmtDate(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

type DocBadge = {
  tone: "emerald" | "amber" | "red";
  label: string;
};

function badgeForExpires(dateISO: string): DocBadge {
  const d = daysUntil(dateISO);

  if (!Number.isFinite(d)) return { tone: "amber", label: "Pendiente" };
  if (d < 0) return { tone: "red", label: "Vencido" };
  if (d <= 30) return { tone: "amber", label: "Próximo a vencer" };

  return { tone: "emerald", label: "Al día" };
}

function Badge({ b }: { b: DocBadge }) {
  const cls =
    b.tone === "emerald"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : b.tone === "amber"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : "bg-red-50 text-red-800 border-red-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold border",
        cls,
      ].join(" ")}
    >
      {b.label}
    </span>
  );
}

export default function DriverCarsPage() {
  const { cityLabel, cityName, loading: cityLoading } = useDriverCity();

  const [status, setStatus] = useState<LoadState>("loading");
  const [msg, setMsg] = useState<string>("");
  const [vehicle, setVehicle] = useState<VehicleDTO | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setStatus("loading");
      setMsg("");
      setVehicle(null);

      try {
        const res = (await apiFetch("/drivers/me/vehicle", { method: "GET", cache: "no-store" })) as any;
        const v = (res?.vehicle ?? res) as VehicleDTO | null;

        if (!mounted) return;

        if (!v || !v?.id) {
          setStatus("empty");
          setMsg("Aún no tienes un vehículo registrado.");
          return;
        }

        setVehicle(v);
        setStatus("ok");
      } catch (e: any) {
        if (!mounted) return;
        setStatus("error");
        if (e?.status === 404) {
          setMsg("Falta crear en backend: GET /drivers/me/vehicle (y endpoints ADMIN para registrar/editar).");
        } else {
          setMsg(e?.message || "No se pudo cargar.");
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const overall = useMemo(() => {
    if (!vehicle) return null;

    const soatDays = daysUntil(vehicle.soatExpiresAt);
    const tecDays = daysUntil(vehicle.tecnicomecanicaExpiresAt);

    const expired = soatDays < 0 || tecDays < 0;
    const soon = !expired && (soatDays <= 30 || tecDays <= 30);

    if (expired) return { tone: "red" as const, label: "Documentos vencidos" };
    if (soon) return { tone: "amber" as const, label: "Revisar vencimientos" };
    return { tone: "emerald" as const, label: "Documentación al día" };
  }, [vehicle]);

  const cityText = cityLoading ? "Cargando ciudad..." : cityLabel || cityName || "Ciudad no asignada";

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-4">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">Vehículos</h1>
          <p className="mt-1 text-sm text-gray-600">Vehículo activo y documentación</p>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {cityText}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
          {status === "loading" ? (
            <div className="text-sm text-gray-600">Cargando desde backend…</div>
          ) : null}

          {status === "error" ? (
            <div className="text-sm text-red-700">{msg}</div>
          ) : null}

          {status === "empty" ? (
            <div>
              <div className="text-sm text-gray-700">{msg}</div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-extrabold text-amber-900 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Importante</span>
                </div>
                <div className="mt-2 text-xs text-amber-900 leading-relaxed">
                  Por seguridad y cumplimiento normativo, los datos del vehículo solo pueden ser modificados por el equipo administrativo.
                  Si necesitas actualizar esta información para operar en {cityLoading ? "tu ciudad" : cityText}, por favor contacta a soporte.
                </div>
              </div>
            </div>
          ) : null}

          {status === "ok" && vehicle ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Ciudad operativa</div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">{cityText}</div>
                <div className="mt-1 text-[12px] text-slate-600">
                  Este vehículo respalda tu operación actual como conductor.
                </div>
              </div>

              {overall ? (
                <div className="flex justify-end">
                  <Badge b={overall} />
                </div>
              ) : null}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide">
                      Vehículo
                    </div>
                    <div className="mt-1 text-base font-extrabold text-gray-900">
                      {vehicle.brand} {vehicle.model} <span className="text-gray-400">·</span> {vehicle.color}
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      Placa: <span className="font-extrabold">{vehicle.plate}</span>
                    </div>
                  </div>

                  <span
                    className={[
                      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold border",
                      vehicle.isActive
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-red-50 text-red-800 border-red-200",
                    ].join(" ")}
                  >
                    {vehicle.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide">
                      SOAT
                    </div>
                    <div className="mt-2 text-sm text-gray-800">
                      Número: <span className="font-extrabold">{vehicle.soatNumber}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-800">
                      Vence: <span className="font-extrabold">{fmtDate(vehicle.soatExpiresAt)}</span>
                    </div>
                  </div>

                  <Badge b={badgeForExpires(vehicle.soatExpiresAt)} />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide">
                      Tecnomecánica
                    </div>
                    <div className="mt-2 text-sm text-gray-800">
                      Número: <span className="font-extrabold">{vehicle.tecnicomecanicaNumber}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-800">
                      Vence: <span className="font-extrabold">{fmtDate(vehicle.tecnicomecanicaExpiresAt)}</span>
                    </div>
                  </div>

                  <Badge b={badgeForExpires(vehicle.tecnicomecanicaExpiresAt)} />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-extrabold text-amber-900 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Importante</span>
                </div>
                <div className="mt-2 text-xs text-amber-900 leading-relaxed">
                  Por seguridad y cumplimiento normativo, los datos del vehículo solo pueden ser actualizados por el equipo administrativo.
                  Si necesitas realizar algún cambio, por favor contacta a soporte.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}