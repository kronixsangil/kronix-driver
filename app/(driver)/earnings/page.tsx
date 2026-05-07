// app/(driver)/earnings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/apiFetch";
import { loadDriverHistoryWithSnapshot, type DriverHistoryItem } from "../lib/driverHistory";
import { useDriverCity } from "../components/DriverCityContext";

type PayStatus = "PENDING" | "PAID";
type RangeFilter = "30D" | "90D" | "ALL";
type PayFilter = "ALL" | PayStatus;

function formatCOP(v: number) {
  return v.toLocaleString("es-CO", { style: "currency", currency: "COP" });
}

function getISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

function weekKeyEs(d: Date) {
  const { year, week } = getISOWeek(d);
  return `Sem${week}-${year}`;
}

function parseISO(d: string) {
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CO");
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string | null | undefined) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-CO");
  } catch {
    return String(iso);
  }
}

type DriverPayoutItem = {
  id: string;
  amountCOP: number;
  ordersCount: number;
  status: PayStatus;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  scheduledPayDate: string;
  paidAt: string | null;
  paidMethod: string | null;
  paidRef: string | null;
};

type DriverPayoutsResponse = { items: DriverPayoutItem[] };

const CARD = "rounded-2xl border border-gray-200 bg-white shadow-sm";

export default function DriverEarningsPage() {
  const { cityLabel, cityName, loading: cityLoading } = useDriverCity();

  const [items, setItems] = useState<DriverHistoryItem[]>([]);
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const [loadingSnap, setLoadingSnap] = useState(false);

  const [payouts, setPayouts] = useState<DriverPayoutItem[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  const [payoutsError, setPayoutsError] = useState<string>("");

  const range: RangeFilter = "ALL";
  const payFilter: PayFilter = "ALL";
  const q = "";

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoadingSnap(true);
      try {
        const hydrated = await loadDriverHistoryWithSnapshot();
        if (mounted) setItems(hydrated);
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoadingSnap(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadPayouts() {
      setLoadingPayouts(true);
      setPayoutsError("");

      try {
        const res = (await apiFetch("/drivers/me/payouts?status=ALL", {
          method: "GET",
          cache: "no-store",
          headers: {
            "x-ct-app": "driver",
          },
        })) as DriverPayoutsResponse;

        const arr = Array.isArray(res?.items) ? res.items : [];
        if (mounted) setPayouts(arr);
      } catch (e: any) {
        const msg =
          e?.message ||
          (typeof e === "string" ? e : "") ||
          "No se pudo cargar DriverPayout desde el backend.";
        if (mounted) {
          setPayouts([]);
          setPayoutsError(msg);
        }
        try {
          console.warn("DriverEarnings: error cargando payouts", e);
        } catch {}
      } finally {
        if (mounted) setLoadingPayouts(false);
      }
    }

    loadPayouts();
    return () => {
      mounted = false;
    };
  }, []);

  const cutoffMs = useMemo(() => {
    if (range === "ALL") return 0;
    const days = range === "30D" ? 30 : 90;
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }, [range]);

  const deliveredOnly = useMemo(() => {
    const base = items.filter((x) => x.status === "DELIVERED");
    const ranged = cutoffMs === 0 ? base : base.filter((x) => parseISO(x.deliveredAtISO) >= cutoffMs);

    const nq = q.trim().toLowerCase();
    const searched = !nq
      ? ranged
      : ranged.filter((x) => {
          const dateText = formatDate(x.deliveredAtISO).toLowerCase();
          return x.storeName.toLowerCase().includes(nq) || x.id.toLowerCase().includes(nq) || dateText.includes(nq);
        });

    return searched;
  }, [items, cutoffMs, q]);

  const payoutsByWeek = useMemo(() => {
    const map: Record<
      string,
      {
        status: PayStatus;
        scheduledPayDate: string;
        paidAt: string | null;
        paidMethod: string | null;
        paidRef: string | null;
        amountCOP: number;
        ordersCount: number;
        periodStart: string;
        periodEnd: string;
      }
    > = {};

    for (const p of payouts) {
      const rawStatus = String((p as any)?.status ?? "PENDING").toUpperCase();
      const safeStatus: PayStatus = rawStatus === "PAID" ? "PAID" : "PENDING";

      const keyStart = weekKeyEs(new Date(p.periodStart));
      map[keyStart] = {
        status: safeStatus,
        scheduledPayDate: p.scheduledPayDate,
        paidAt: p.paidAt,
        paidMethod: p.paidMethod,
        paidRef: p.paidRef,
        amountCOP: Number(p.amountCOP ?? 0),
        ordersCount: Number(p.ordersCount ?? 0),
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
      };

      const keyEnd = weekKeyEs(new Date(p.periodEnd));
      if (!map[keyEnd]) {
        map[keyEnd] = {
          status: safeStatus,
          scheduledPayDate: p.scheduledPayDate,
          paidAt: p.paidAt,
          paidMethod: p.paidMethod,
          paidRef: p.paidRef,
          amountCOP: Number(p.amountCOP ?? 0),
          ordersCount: Number(p.ordersCount ?? 0),
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
        };
      }
    }

    return map;
  }, [payouts]);

  const grouped = useMemo(() => {
    const map = new Map<string, DriverHistoryItem[]>();

    for (const it of deliveredOnly) {
      const d = new Date(it.deliveredAtISO);
      const k = weekKeyEs(d);
      map.set(k, [...(map.get(k) ?? []), it]);
    }

    const weeks = Array.from(map.entries()).map(([k, list]) => {
      const total = list.reduce((acc, x) => acc + (x.payoutCOP ?? 0), 0);
      const deliveries = list.length;

      const payout = payoutsByWeek[k];
      const payStatus: PayStatus = payout?.status ?? "PENDING";
      const missingSnapshots = list.filter((x) => x.payoutSource === "MISSING").length;

      return {
        key: k,
        total,
        deliveries,
        payStatus,
        missingSnapshots,
        payoutMeta: payout || null,
        list: list.sort((a, b) => parseISO(b.deliveredAtISO) - parseISO(a.deliveredAtISO)),
      };
    });

    const payFiltered = payFilter === "ALL" ? weeks : weeks.filter((w) => w.payStatus === payFilter);

    return payFiltered.sort((a, b) => {
      const at = a.list[0]?.deliveredAtISO ? parseISO(a.list[0].deliveredAtISO) : 0;
      const bt = b.list[0]?.deliveredAtISO ? parseISO(b.list[0].deliveredAtISO) : 0;
      return bt - at;
    });
  }, [deliveredOnly, payFilter, payoutsByWeek]);

  const totals = useMemo(() => {
    const totalCOP = grouped.reduce((acc, w) => acc + w.total, 0);
    const deliveries = grouped.reduce((acc, w) => acc + w.deliveries, 0);
    return { totalCOP, deliveries };
  }, [grouped]);

  const cityText = cityLoading ? "Cargando ciudad..." : cityLabel || cityName || "Ciudad no asignada";

  return (
    <div className="w-full bg-slate-50 p-0">
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0">
        <div className="sticky top-0 z-20 bg-slate-50/92 backdrop-blur">
          <div className="pt-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-extrabold text-gray-900">Ganancias</h1>
                <p className="mt-1 text-s text-gray-600">
                  Pago semanal · <span className="font-semibold text-gray-900">{grouped.length}</span> semanas
                </p>

                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  {cityText}
                </div>

                {loadingSnap || loadingPayouts ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Actualizando…
                  </div>
                ) : null}

                {payoutsError ? (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
                    No se pudieron cargar pagos desde el servidor: {payoutsError}
                  </div>
                ) : null}
              </div>

              <div className="text-right text-[11px] text-gray-600">
                <div>
                  <span className="font-semibold text-gray-900">{totals.deliveries}</span> entregas
                </div>
                <div className="mt-0.5">
                  Total: <span className="text-sm font-extrabold text-emerald-700">{formatCOP(totals.totalCOP)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 h-px w-full bg-gray-200" />
          <div className="h-3" />
        </div>

        <div className="no-scrollbar max-h-[calc(100dvh-236px)] overflow-y-auto">
          {grouped.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
              Aún no hay entregas registradas para {cityLoading ? "tu ciudad operativa" : cityText}.
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {grouped.map((w) => {
                const opened = openWeek === w.key;

                const payPill =
                  w.payStatus === "PAID" ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
                      PAGADO
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200">
                      PENDIENTE
                    </span>
                  );

                const meta = w.payoutMeta;

                return (
                  <div
                    key={w.key}
                    className={[CARD, "overflow-hidden transition", "hover:shadow-md hover:border-gray-300"].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenWeek(opened ? null : w.key)}
                      className="w-full px-4 py-4 text-left"
                      aria-expanded={opened}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-gray-900">{w.key}</p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                            <span>
                              Entregas: <span className="font-semibold text-gray-900">{w.deliveries}</span>
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>
                              Total: <span className="font-extrabold text-emerald-700">{formatCOP(w.total)}</span>
                            </span>

                            {meta?.scheduledPayDate ? (
                              <>
                                <span className="text-gray-300">•</span>
                                <span>
                                  Pago prog:{" "}
                                  <span className="font-semibold text-gray-900">
                                    {formatDateShort(meta.scheduledPayDate)}
                                  </span>
                                </span>
                              </>
                            ) : null}

                            {w.payStatus === "PAID" && meta?.paidAt ? (
                              <>
                                <span className="text-gray-300">•</span>
                                <span>
                                  Pagado: <span className="font-semibold text-gray-900">{formatDateShort(meta.paidAt)}</span>
                                </span>
                              </>
                            ) : null}

                            {w.missingSnapshots > 0 ? (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="font-semibold text-amber-700">{w.missingSnapshots} sin snapshot</span>
                              </>
                            ) : null}
                          </div>

                          {w.payStatus === "PAID" && (meta?.paidMethod || meta?.paidRef) ? (
                            <div className="mt-2 text-[11px] text-gray-600">
                              {meta?.paidMethod ? (
                                <span>
                                  Método: <span className="font-semibold text-gray-900">{meta.paidMethod}</span>
                                </span>
                              ) : null}
                              {meta?.paidMethod && meta?.paidRef ? <span className="mx-2 text-gray-300">•</span> : null}
                              {meta?.paidRef ? (
                                <span>
                                  Ref: <span className="font-mono text-gray-900">{meta.paidRef}</span>
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {payPill}
                          <span className="text-[11px] font-semibold text-gray-500">{opened ? "Ocultar" : "Ver desglose"}</span>
                        </div>
                      </div>
                    </button>

                    <div
                      className={[
                        "grid transition-all duration-200 ease-out",
                        opened ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      ].join(" ")}
                    >
                      <div className="overflow-hidden px-4 pb-4">
                        <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                              <div className="text-[11px] font-semibold text-gray-500">Total semana</div>
                              <div className="mt-1 text-sm font-extrabold text-emerald-700">{formatCOP(w.total)}</div>
                            </div>

                            <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                              <div className="text-[11px] font-semibold text-gray-500">Entregas</div>
                              <div className="mt-1 text-sm font-extrabold text-gray-900">{w.deliveries}</div>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            {w.list.map((it) => (
                              <div key={it.historyId} className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="truncate font-extrabold text-gray-900">{it.storeName}</div>
                                    <div className="mt-1 text-xs text-gray-600">{formatDate(it.deliveredAtISO)}</div>
                                    <div className="mt-1 text-xs text-gray-600">
                                      Pedido: <span className="font-mono">{it.id}</span>
                                    </div>

                                    {it.payoutSource === "MISSING" ? (
                                      <div className="mt-2 text-[11px] font-extrabold text-amber-700">
                                        ⚠️ Sin snapshot (payout en $0)
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="shrink-0 text-right">
                                    <div className="font-extrabold text-emerald-700">{formatCOP(it.payoutCOP)}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {!meta ? (
                            <div className="mt-3 text-[11px] text-gray-500">
                              Nota: el payout de esta semana aún no ha sido generado por el administrador.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-2 text-center text-[11px] text-gray-500">
          Ganancias del conductor integradas al esquema multiciudad. ✅
        </div>
      </div>
    </div>
  );
}