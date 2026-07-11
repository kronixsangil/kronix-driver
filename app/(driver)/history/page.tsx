// app/(driver)/history/page.tsx
// app/(driver)/history/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { loadDriverHistoryWithSnapshot, type DriverHistoryItem } from "../lib/driverHistory";
import { useDriverCity } from "../components/DriverCityContext";
import { getServiceConfig } from "../lib/serviceConfig";

function formatCOP(v: number) {
  return v.toLocaleString("es-CO", { style: "currency", currency: "COP" });
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CO");
  } catch {
    return iso;
  }
}

type Filter = "ALL" | "DELIVERED" | "CANCELLED";
const CARD = "rounded-2xl border border-gray-200 bg-white shadow-sm";

function getHistoryDisplayName(item: DriverHistoryItem) {
  const meta = getServiceConfig(item as any);
  if (meta.serviceType !== "STORE" && meta.serviceType !== "UNKNOWN") return meta.label;
  return item.storeName || meta.label;
}


export default function DriverHistoryPage() {
  const { cityLabel, cityName, loading: cityLoading } = useDriverCity();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<DriverHistoryItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const data = await loadDriverHistoryWithSnapshot();
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    const limitMs = 30 * 24 * 60 * 60 * 1000;
    const normalizedQ = q.trim().toLowerCase();

    return items
      .filter((it) => {
        const t = Date.parse(it.deliveredAtISO);
        return Number.isFinite(t) ? now - t <= limitMs : true;
      })
      .filter((it) => {
        if (filter === "ALL") return true;
        return it.status === filter;
      })
      .filter((it) => {
        if (!normalizedQ) return true;
        const dateText = formatDate(it.deliveredAtISO).toLowerCase();
        return (
          getHistoryDisplayName(it).toLowerCase().includes(normalizedQ) ||
          it.id.toLowerCase().includes(normalizedQ) ||
          dateText.includes(normalizedQ) ||
          it.status.toLowerCase().includes(normalizedQ)
        );
      });
  }, [items, q, filter]);

  const counts = useMemo(() => {
    const delivered = items.filter((x) => x.status === "DELIVERED").length;
    const cancelled = items.filter((x) => x.status === "CANCELLED").length;
    return { total: items.length, delivered, cancelled };
  }, [items]);

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
                <h1 className="text-lg font-extrabold text-gray-900">Historial</h1>
                <p className="mt-1 text-s text-gray-600">
                  Últimos 30 días · <span className="font-semibold text-gray-900">{filtered.length}</span> visibles
                </p>

                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  {cityText}
                </div>

                {loading ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Actualizando…
                  </div>
                ) : null}
              </div>

              <div className="text-right text-[11px] text-gray-600">
                <div>
                  <span className="font-semibold text-gray-900">{counts.total}</span> total
                </div>
                <div className="mt-0.5 flex items-center justify-end gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {counts.delivered}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {counts.cancelled}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 h-px w-full bg-gray-200" />
          <div className="h-3" />
        </div>

        <div className={[CARD, "sticky top-[108px] z-10", "bg-white/92 backdrop-blur", "px-3 py-3"].join(" ")}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={[
                "flex-1 rounded-full px-3 py-2 text-xs font-extrabold ring-1 transition",
                "active:scale-[0.99]",
                filter === "ALL"
                  ? "bg-emerald-600 text-white ring-emerald-600 shadow-sm"
                  : "bg-white text-gray-800 ring-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilter("DELIVERED")}
              className={[
                "flex-1 rounded-full px-3 py-2 text-xs font-extrabold ring-1 transition",
                "active:scale-[0.99]",
                filter === "DELIVERED"
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : "bg-white text-gray-800 ring-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              Entregados
            </button>
            <button
              type="button"
              onClick={() => setFilter("CANCELLED")}
              className={[
                "flex-1 rounded-full px-3 py-2 text-xs font-extrabold ring-1 transition",
                "active:scale-[0.99]",
                filter === "CANCELLED"
                  ? "bg-red-50 text-red-800 ring-red-200"
                  : "bg-white text-gray-800 ring-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              Cancelados
            </button>
          </div>
        </div>

        <div className="h-3" />

        <div className="no-scrollbar max-h-[calc(100dvh-306px)] overflow-y-auto pb-2">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
              {loading ? "Cargando historial…" : `No hay registros en los últimos 30 días para ${cityLoading ? "tu ciudad" : cityText}.`}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((h) => {
                const isOpen = openId === h.historyId;
                const isCancelled = h.status === "CANCELLED";

                const pill = isCancelled ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-extrabold text-red-700 ring-1 ring-red-200">
                    CANCELADO
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
                    ENTREGADO
                  </span>
                );

                return (
                  <div
                    key={h.historyId}
                    className={[
                      "rounded-2xl border border-gray-200 bg-white shadow-sm transition",
                      "hover:shadow-md hover:border-gray-300",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId((prev) => (prev === h.historyId ? null : h.historyId))}
                      className="w-full rounded-2xl px-4 py-3 text-left"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-gray-900">{getHistoryDisplayName(h)}</div>
                          <div className="mt-1 text-xs font-semibold text-gray-600">{formatDate(h.deliveredAtISO)}</div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {pill}
                          <span className="text-[11px] font-semibold text-gray-500">{isOpen ? "Ocultar" : "Ver"}</span>
                        </div>
                      </div>
                    </button>

                    <div
                      className={[
                        "grid transition-all duration-200 ease-out",
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      ].join(" ")}
                    >
                      <div className="overflow-hidden px-4 pb-4">
                        <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="text-sm font-extrabold text-gray-900">
                              Pedido <span className="font-mono">#{h.id}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard?.writeText(h.id);
                              }}
                              className="rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 active:scale-[0.99]"
                            >
                              Copiar ID
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                              <div className="text-[11px] font-semibold text-gray-500">Comercio</div>
                              <div className="mt-1 text-sm font-bold text-gray-900 line-clamp-2">{getHistoryDisplayName(h)}</div>
                            </div>

                            <div className="rounded-xl bg-white p-3 ring-1 ring-gray-200">
                              <div className="text-[11px] font-semibold text-gray-500">Pago</div>
                              <div
                                className={[
                                  "mt-1 text-sm font-extrabold",
                                  isCancelled ? "text-gray-900" : "text-emerald-700",
                                ].join(" ")}
                              >
                                {formatCOP(h.payoutCOP)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-gray-200">
                            <div className="text-[11px] font-semibold text-gray-500">Fecha</div>
                            <div className="mt-1 text-sm font-bold text-gray-900">{formatDate(h.deliveredAtISO)}</div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              Estado:{" "}
                              <span className={isCancelled ? "font-bold text-red-700" : "font-bold text-emerald-700"}>
                                {isCancelled ? "Cancelado" : "Entregado"}
                              </span>
                            </div>

                            <span className="text-[11px] font-semibold text-gray-500">
                              Toque para {isOpen ? "ocultar" : "ver"} detalles
                            </span>
                          </div>
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
          Consejo: historial del worker alineado con tu operación multiciudad. ✅
        </div>
      </div>
    </div>
  );
}


