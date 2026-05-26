//app/(driver)/profile/components/cards/MetricsCard.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../../../lib/apiFetch";

function MetricCard({
  label,
  value,
  hint,
  strong = false,
}: {
  label: string;
  value: any;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={[
          "mt-1 text-gray-900",
          strong ? "text-2xl font-black" : "text-xl font-extrabold",
        ].join(" ")}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-gray-500">{hint}</p> : null}
    </div>
  );
}

function clampPct(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseSummary(payload: any): {
  avgRating: number | null;
  ratingsCount: number;
  avgDeliveryMinutes: number | null;
  deliveriesCount: number;
} {
  const avgRating =
    toNum(payload?.avgRating) ??
    toNum(payload?.avg) ??
    toNum(payload?.average) ??
    toNum(payload?.ratingAvg) ??
    toNum(payload?.rating) ??
    toNum(payload?._avg?.rating) ??
    null;

  const ratingsCountRaw =
    toNum(payload?.ratingsCount) ??
    toNum(payload?.count) ??
    toNum(payload?.total) ??
    toNum(payload?.ratingCount) ??
    toNum(payload?._count?.rating) ??
    0;

  const ratingsCount = Math.max(0, Math.round(Number(ratingsCountRaw || 0)));

  const avgDeliveryMinutes =
    toNum(payload?.avgDeliveryMinutes) ??
    toNum(payload?.avgMinutes) ??
    toNum(payload?.avgDeliveryMin) ??
    toNum(payload?.avgTimeMinutes) ??
    null;

  const deliveriesCountRaw =
    toNum(payload?.deliveriesCount) ??
    toNum(payload?.deliveredCount) ??
    toNum(payload?.deliveries) ??
    0;

  const deliveriesCount = Math.max(
    0,
    Math.round(Number(deliveriesCountRaw || 0))
  );

  return { avgRating, ratingsCount, avgDeliveryMinutes, deliveriesCount };
}

function formatAvgTime(avgMinutes: number | null) {
  if (avgMinutes === null || !Number.isFinite(avgMinutes)) return "—";
  const m = Math.max(0, Math.round(avgMinutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

export default function MetricsCard({
  isOpen,
  onToggle,
  deliveries,
  pickups,
  cancellations,
  avgTime,
  rating,
  levelKey,
  progressPct,
  remaining,
  hasNext,
}: {
  isOpen: boolean;
  onToggle: () => void;
  deliveries: number;
  pickups: number;
  cancellations: number;
  avgTime: string;
  rating: string;
  levelKey: string;
  progressPct: number;
  remaining: number;
  hasNext: boolean;
}) {
  const pct = clampPct(progressPct);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingsCount, setRatingsCount] = useState<number>(0);

  const [avgDeliveryMinutes, setAvgDeliveryMinutes] = useState<number | null>(
    null
  );
  const [deliveriesCount, setDeliveriesCount] = useState<number>(0);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr(null);
      setLoading(true);

      try {
        const res = await apiFetch<any>(`/drivers/me/rating-summary`, {
          method: "GET",
        });

        if (!alive) return;

        const parsed = parseSummary(res);

        setAvgRating(parsed.avgRating);
        setRatingsCount(parsed.ratingsCount);
        setAvgDeliveryMinutes(parsed.avgDeliveryMinutes);
        setDeliveriesCount(parsed.deliveriesCount);
      } catch (e: any) {
        if (!alive) return;

        const status = Number(e?.status);
        if (status === 401 || status === 403) {
          setErr("No autorizado. Cierra sesión y vuelve a iniciar sesión.");
        } else {
          const msg =
            String(e?.message ?? "").trim() ||
            "No se pudo cargar métricas desde el servidor.";
          setErr(msg);
        }
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const ratingDisplay = useMemo(() => {
    if (avgRating !== null && Number.isFinite(avgRating)) {
      const fixed = Math.max(0, Math.min(5, avgRating));
      return `⭐ ${fixed.toFixed(1)}`;
    }

    return !rating || rating === "—" ? "⭐ —" : rating;
  }, [avgRating, rating]);

  const ratingHint = useMemo(() => {
    if (loading) return "Cargando…";
    if (err) return err;

    if (avgRating === null) {
      return "Aún sin calificaciones. Cuando el cliente califique, aparecerá aquí.";
    }

    return `Basado en ${ratingsCount} calificacion${
      ratingsCount === 1 ? "" : "es"
    }.`;
  }, [loading, err, avgRating, ratingsCount]);

  const avgTimeDisplay = useMemo(() => {
    if (avgDeliveryMinutes !== null && Number.isFinite(avgDeliveryMinutes)) {
      return formatAvgTime(avgDeliveryMinutes);
    }

    return !avgTime || avgTime === "—" ? "—" : avgTime;
  }, [avgDeliveryMinutes, avgTime]);

  const avgTimeHint = useMemo(() => {
    if (loading) return "Cargando…";
    if (err) return err;

    if (avgDeliveryMinutes === null) {
      return "Aún sin datos suficientes. Se activará cuando haya entregas reales.";
    }

    const base = deliveriesCount
      ? `Basado en ${deliveriesCount} entrega${
          deliveriesCount === 1 ? "" : "s"
        }.`
      : "Promedio de tus entregas.";

    return `${base} (createdAt → deliveredAt)`;
  }, [loading, err, avgDeliveryMinutes, deliveriesCount]);

  return (
    <div className="mx-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex w-full items-center gap-4 px-4 py-4 text-left active:scale-[0.99]"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-visible">
          <Image
            src="/branding/Profile/Metrics.png"
            alt="Mis métricas"
            fill
            sizes="64px"
            className="
              pointer-events-none
              select-none
              object-contain
              drop-shadow-sm
              scale-[1.28]
              translate-x-[0px]
              translate-y-[0px]
            "
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xl font-black leading-6 text-slate-950">
            Mis métricas
          </div>
          <div className="mt-1 text-[13px] leading-5 text-slate-600">
            Resumen de desempeño
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-800 ring-1 ring-slate-200">
            Hoy
          </span>

          <span className="text-[13px] font-black text-slate-700">
            {isOpen ? "Ocultar" : "Ver"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-gray-900">
                  Nivel del conductor
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Nivel actual: {levelKey}
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
                {levelKey}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Progreso al siguiente nivel</span>
                <span className="font-semibold">{pct}%</span>
              </div>

              <div className="mt-2 h-2.5 w-full rounded-full bg-white">
                <div
                  className="h-2.5 rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {hasNext ? (
                <p className="mt-2 text-xs text-gray-500">
                  Te faltan <span className="font-semibold">{remaining}</span>{" "}
                  entregas para subir de nivel.
                </p>
              ) : (
                <p className="mt-2 text-xs text-gray-500">
                  🎉 Has alcanzado el nivel máximo.
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Entregas</p>
                  <p className="mt-1 text-xl font-extrabold text-gray-900">
                    {deliveries}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-semibold text-gray-500">
                    Recogidas
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-gray-900">
                    {pickups}
                  </p>
                </div>
              </div>

              <div className="mt-2 h-1 w-full rounded-full bg-gray-100">
                <div
                  className="h-1 rounded-full bg-emerald-600 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (deliveries / Math.max(1, deliveries + cancellations)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-1 text-[11px] text-gray-500">
                <span className="font-semibold text-gray-700">
                  Productividad
                </span>{" "}
                (MVP)
              </p>
            </div>

            <MetricCard label="Cancelaciones" value={cancellations} />

            <MetricCard
              label="Tiempo prom."
              value={avgTimeDisplay}
              hint={avgTimeHint}
            />

            <MetricCard
              label="Calificación"
              value={ratingDisplay}
              hint={ratingHint}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}