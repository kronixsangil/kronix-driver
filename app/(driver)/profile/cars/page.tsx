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

type DriverDocumentCheck = {
  id?: string;
  type: string;
  status: string;
  documentNumber?: string | null;
  expiresAt?: string | null;
  receivedAt?: string | null;
  reviewedAt?: string | null;
  internalNotes?: string | null;
  waiverReason?: string | null;
  waiverExpiresAt?: string | null;
};

type LoadState = "loading" | "ok" | "empty" | "error";

const DRIVER_DOCUMENT_TYPES = [
  "ID_CARD",
  "DRIVER_LICENSE",
  "SELFIE_OR_PROFILE_PHOTO",
  "SOAT",
  "TECHNOMECHANICAL",
  "VEHICLE_OWNERSHIP_CARD",
  "VEHICLE_PHOTO_OR_INSPECTION",
  "BACKGROUND_CHECK",
] as const;

const DRIVER_DOCUMENT_LABELS: Record<string, string> = {
  ID_CARD: "Cédula",
  DRIVER_LICENSE: "Licencia de conducción",
  SELFIE_OR_PROFILE_PHOTO: "Selfie / Foto presencial",
  SOAT: "SOAT",
  TECHNOMECHANICAL: "Tecnomecánica",
  VEHICLE_OWNERSHIP_CARD: "Tarjeta de propiedad",
  VEHICLE_PHOTO_OR_INSPECTION: "Foto / Inspección vehículo",
  BACKGROUND_CHECK: "Antecedentes",
};

function daysUntil(dateISO: string) {
  const now = new Date();
  const d = new Date(dateISO);
  const ms = d.getTime() - now.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function fmtDate(dateISO?: string | null) {
  if (!dateISO) return "—";

  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

type DocBadge = {
  tone: "emerald" | "amber" | "red" | "blue" | "slate";
  label: string;
};

function badgeForExpires(dateISO: string): DocBadge {
  const d = daysUntil(dateISO);

  if (!Number.isFinite(d)) return { tone: "amber", label: "Pendiente" };
  if (d < 0) return { tone: "red", label: "Vencido" };
  if (d <= 30) return { tone: "amber", label: "Próximo a vencer" };

  return { tone: "emerald", label: "Al día" };
}

function badgeForStatus(statusRaw?: string | null): DocBadge {
  const status = String(statusRaw ?? "PENDING").toUpperCase();

  if (status === "APPROVED") return { tone: "emerald", label: "Aprobado" };
  if (status === "TEMPORARY_APPROVED") return { tone: "blue", label: "Aval temporal" };
  if (status === "RECEIVED") return { tone: "amber", label: "Recibido" };
  if (status === "REJECTED") return { tone: "red", label: "Rechazado" };
  if (status === "EXPIRED") return { tone: "red", label: "Vencido" };

  return { tone: "slate", label: "Pendiente" };
}

function Badge({ b }: { b: DocBadge }) {
  const cls =
    b.tone === "emerald"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : b.tone === "amber"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : b.tone === "blue"
          ? "bg-blue-50 text-blue-800 border-blue-200"
          : b.tone === "red"
            ? "bg-red-50 text-red-800 border-red-200"
            : "bg-slate-50 text-slate-700 border-slate-200";

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

function DocumentCheckCard({ doc, type }: { doc: DriverDocumentCheck | null; type: string }) {
  const badge = badgeForStatus(doc?.status);
  const isTemporary = String(doc?.status ?? "").toUpperCase() === "TEMPORARY_APPROVED";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide">
            {DRIVER_DOCUMENT_LABELS[type] ?? type}
          </div>

          {doc?.documentNumber ? (
            <div className="mt-2 text-sm text-gray-800">
              Número: <span className="font-extrabold">{doc.documentNumber}</span>
            </div>
          ) : null}

          {doc?.expiresAt ? (
            <div className="mt-1 text-sm text-gray-800">
              Vence: <span className="font-extrabold">{fmtDate(doc.expiresAt)}</span>
            </div>
          ) : null}

          {isTemporary ? (
            <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-[12px] leading-relaxed text-blue-900">
              <div className="font-extrabold">Aval temporal</div>
              <div>Hasta: {fmtDate(doc?.waiverExpiresAt)}</div>
              {doc?.waiverReason ? <div>Razón: {doc.waiverReason}</div> : null}
            </div>
          ) : null}
        </div>

        <Badge b={badge} />
      </div>
    </div>
  );
}

export default function DriverCarsPage() {
  const { cityLabel, cityName, loading: cityLoading } = useDriverCity();

  const [status, setStatus] = useState<LoadState>("loading");
  const [msg, setMsg] = useState<string>("");
  const [vehicle, setVehicle] = useState<VehicleDTO | null>(null);
  const [documentChecks, setDocumentChecks] = useState<DriverDocumentCheck[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setStatus("loading");
      setMsg("");
      setVehicle(null);
      setDocumentChecks([]);

      try {
        const [vehicleRes, docsRes] = await Promise.all([
          apiFetch("/drivers/me/vehicle", { method: "GET", cache: "no-store" }),
          apiFetch("/drivers/me/documents", { method: "GET", cache: "no-store" }),
        ]);

        if (!mounted) return;

        const v = ((vehicleRes as any)?.vehicle ?? vehicleRes) as VehicleDTO | null;
        setDocumentChecks(Array.isArray((docsRes as any)?.documents) ? (docsRes as any).documents : []);

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
        setMsg(e?.message || "No se pudo cargar.");
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

  const documentChecksByType = useMemo(() => {
    const map = new Map<string, DriverDocumentCheck>();
    for (const doc of documentChecks) {
      map.set(String(doc.type), doc);
    }
    return map;
  }, [documentChecks]);

  const cityText = cityLoading ? "Cargando ciudad..." : cityLabel || cityName || "Ciudad no asignada";

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-4">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">Vehículos y documentos</h1>
          <p className="mt-1 text-sm text-gray-600">Estado operativo, vehículo y avales KroniX</p>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {cityText}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
          {status === "loading" ? (
            <div className="text-sm text-gray-600">Cargando desde backend…</div>
          ) : null}

          {status === "error" ? <div className="text-sm text-red-700">{msg}</div> : null}

          {status === "empty" ? (
            <div>
              <div className="text-sm text-gray-700">{msg}</div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-extrabold text-amber-900 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Importante</span>
                </div>
                <div className="mt-2 text-xs text-amber-900 leading-relaxed">
                  Por seguridad y cumplimiento normativo, los datos del vehículo y documentos son revisados por el equipo KroniX.
                  Si necesitas actualizar información para operar en {cityLoading ? "tu ciudad" : cityText}, contacta a soporte.
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
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">
            Avales documentales KroniX
          </div>
          <div className="mt-1 text-sm font-extrabold text-gray-900">
            Revisión administrativa presencial
          </div>
          <div className="mt-2 text-[12px] leading-relaxed text-gray-600">
            KroniX revisa tus documentos físicos durante el proceso de vinculación y capacitación. Aquí puedes consultar el estado, pero no necesitas subir archivos desde la app.
          </div>

          <div className="mt-4 space-y-3">
            {DRIVER_DOCUMENT_TYPES.map((type) => (
              <DocumentCheckCard
                key={type}
                type={type}
                doc={documentChecksByType.get(type) ?? null}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-extrabold text-amber-900 flex items-center gap-2">
            <span>⚠️</span>
            <span>Importante</span>
          </div>
          <div className="mt-2 text-xs text-amber-900 leading-relaxed">
            Si un documento aparece pendiente, rechazado o vencido, comunícate con el equipo KroniX. La operación puede quedar bloqueada hasta completar la revisión.
          </div>
        </div>
      </div>
    </div>
  );
}