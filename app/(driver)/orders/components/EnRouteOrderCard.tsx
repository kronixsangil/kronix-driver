  //app/(driver)/orders/components/EnRouteOrderCard.tsx
  "use client";

  import Image from "next/image";
  import { useEffect, useMemo, useRef, useState } from "react";
  import { pushDriverSyncEvent } from "../../lib/driverSync";
  import { driverUpdateOrderStatus } from "../../lib/driverOrderApi";
  import { openMapsNavigation } from "../../lib/openMaps";
  import type { DriverOrder } from "../../lib/types";
  import {
    formatPackageLabel,
    getEnRouteServiceMeta,
    getOrderServiceType,
  } from "../../lib/serviceConfig";

  interface Props {
    order: DriverOrder;
    onDelivered?: () => void;
  }


  function buildRouteFromStops(order: DriverOrder) {
    const normalize = (v: unknown) =>
      String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

    const stops = Array.isArray(order.courierStops)
      ? order.courierStops
          .slice()
          .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      : [];

    if (!stops.length) return [];

    const firstAddress = normalize(order.pickupLocations?.[0]?.address);

    const result = stops
      .map((stop, index) => ({
        label: index === stops.length - 1 ? "Punto final" : `Punto ${index + 1}`,
        address: String(stop.address ?? "").trim(),
        reference: String(stop.reference ?? "").trim(),
      }))
      .filter(
        (p) => p.address && normalize(p.address) !== firstAddress
      );

    // 🔥 retorno
    const drop = String(order.dropoffLocation?.address ?? "").trim();
    if (
      drop &&
      normalize(drop) !== firstAddress &&
      !result.some((r) => normalize(r.address) === normalize(drop))
    ) {
      result.push({
        label: "Retorno",
        address: drop,
        reference: "",
      });
    }

    return result;
  }

  export default function EnRouteOrderCard({ order, onDelivered }: Props) {

    const sentEnRouteRef = useRef(false);
    const [delivering, setDelivering] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [openDescription, setOpenDescription] = useState(false);
    const [openDestination, setOpenDestination] = useState(false);
    const [selectedDestinationIndex, setSelectedDestinationIndex] = useState(0);

    const serviceMeta = getEnRouteServiceMeta(order);
    const isCourierFlow = !!getOrderServiceType(order) && getOrderServiceType(order) !== "STORE";
    const packageDescription = String((order as any)?.packageDescription ?? "").trim();

    const customerName = String(order.customerName ?? "Cliente").trim();
    const customerNote = String(order.customerNote ?? "").trim();
    const payout = Number(order.payout ?? 0);

    const routeDestinations = useMemo(() => {
    const stops = Array.isArray(order.courierStops)
      ? order.courierStops
          .slice()
          .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      : [];

    const points = stops.map((stop, index) => ({
      label:
        index === stops.length - 1
          ? "Punto final"
          : `Punto ${index + 1}`,
      address: String(stop.address ?? "").trim(),
      reference: String(stop.reference ?? "").trim(),
    }));

    // 🔥 agregar retorno si aplica
    const drop = String(order.dropoffLocation?.address ?? "").trim();

    if (
      drop &&
      !points.some(
        (p) => p.address.toLowerCase() === drop.toLowerCase()
      )
    ) {
      points.push({
        label: "Punto Final",
        address: drop,
        reference: "",
      });
    }

    return points;
  }, [order.courierStops, order.dropoffLocation]);

    const selectedDestination =
      routeDestinations[selectedDestinationIndex] ?? routeDestinations[0] ?? null;

    useEffect(() => {
      if (routeDestinations.length <= 1) setSelectedDestinationIndex(0);
    }, [routeDestinations.length]);

    useEffect(() => {
      if (!order?.orderId) return;
      if (sentEnRouteRef.current) return;
      sentEnRouteRef.current = true;

      const status = String(order.status ?? "").toUpperCase();
      const flow = String(order.flowStatus ?? "").toUpperCase();
      if (status === "EN_ROUTE" || flow === "EN_ROUTE") return;

      (async () => {
        try {
          const res = await driverUpdateOrderStatus(order.orderId, "EN_ROUTE");
          if (res && "ok" in res && !res.ok) {
            throw new Error("No se pudo marcar EN_ROUTE.");
          }
        } catch {
          // no rompemos UI
        }
      })();
    }, [order?.orderId, order.status, order.flowStatus]);

    const handleNavigateDestination = () => {
  // 1. Intentar usar coordenadas del destino seleccionado (si aplica)
  const selectedStop = Array.isArray(order.courierStops)
    ? order.courierStops
        .slice()
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))[
          selectedDestinationIndex
        ]
    : null;

  if (
    selectedStop &&
    Number.isFinite(Number(selectedStop.lat)) &&
    Number.isFinite(Number(selectedStop.lng))
  ) {
    openMapsNavigation(
      Number(selectedStop.lat),
      Number(selectedStop.lng),
      selectedDestination?.label || "Destino"
    );
    return;
  }

  // 2. Usar coordenadas del dropoff (cliente)
  if (
    Number.isFinite(Number(order.dropoffLocation?.lat)) &&
    Number.isFinite(Number(order.dropoffLocation?.lng))
  ) {
    openMapsNavigation(
      Number(order.dropoffLocation.lat),
      Number(order.dropoffLocation.lng),
      "Destino"
    );
    return;
  }

  // 3. Fallback a dirección (último recurso)
  if (selectedDestination?.address) {
    openMapsNavigation(selectedDestination.address);
    return;
  }

  // 4. Último fallback
  if (order.dropoffLocation?.address) {
    openMapsNavigation(order.dropoffLocation.address);
    return;
  }

  alert("No hay ubicación válida para navegar");
};

    const handleDelivered = async () => {
  if (delivering) return;

  setErr(null);
  setDelivering(true);

  try {
    const res = await driverUpdateOrderStatus(order.orderId, "DELIVERED");

    if (res && "ok" in res && !res.ok) {
      const backendMessage =
        (res as any)?.error?.message ||
        (res as any)?.error?.data?.message ||
        (res as any)?.error?.response?.message ||
        "No se pudo finalizar el servicio.";

      throw new Error(String(backendMessage));
    }

    const completionData = (res as any)?.data ?? null;

    pushDriverSyncEvent({
      orderId: order.orderId,
      status: "DELIVERED",
      flowStatus: "DELIVERED",
      at: Date.now(),
    } as any);

    window.dispatchEvent(
      new CustomEvent("driver:order-delivered", {
        detail: {
          orderId: order.orderId,
          status: "DELIVERED",
          flowStatus: "DELIVERED",
          workerCommissionCOP: Number(
            completionData?.workerCommissionCOP ??
              (order as any)?.workerCommissionCOP ??
              0
          ),
          workerCommissionDebited: Boolean(
            completionData?.workerCommissionDebited
          ),
          wallet: completionData?.wallet ?? null,
          at: Date.now(),
        },
      })
    );

    setTimeout(() => {
      onDelivered?.();
    }, 250);
  } catch (e: any) {
    setErr(e?.message ? String(e.message) : "Falló el update en backend. Reintenta.");
    setDelivering(false);
  }
};

    return (
      <div className="min-h-screen bg-slate-50 px-0 py-0">
        <div className="mx-auto w-full max-w-lg">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
            <div className={`relative overflow-hidden bg-gradient-to-br ${serviceMeta.heroTone} px-4 pt-4 pb-4`}>
              <div className="pointer-events-none absolute inset-0 opacity-60" />

              <div className="relative z-10">
                <div className="pointer-events-none absolute left-[-10px] top-[-5px]">
                  <div className="relative h-[60px] w-[60px]">
                    <Image
                      src={serviceMeta.imageSrc}
                      alt={serviceMeta.imageAlt}
                      fill
                      className="object-contain opacity-95"
                      sizes="60px"
                    />
                  </div>
                </div>                
                <div className="flex flex-col items-center text-center">
                  <div className="flex w-full justify-start pl-[56px] pr-[92px]">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[16px] font-extrabold ${serviceMeta.tone}`}
                    >
                      {serviceMeta.label}
                    </span>
                  </div>

                  <p className="mt-2 w-full text-center text-[14px] font-black uppercase leading-[1.05] text-slate-600">
                    EN RUTA
                  </p>

                  <p className="mt-1 w-full text-center text-[18px] font-black leading-[1.05] text-slate-900">
                    {serviceMeta.headerTitle}
                  </p>

                  <p className="mt-2 w-full text-center text-[12px] text-slate-600">
                    ID: <span className="font-mono">{order.orderId}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="rounded-[18px] px-1 py-1">
                <div className="text-[15px] font-black text-blue-700">
                  Cliente: {customerName}
                </div>

                <div className="mt-2 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    Indicaciones del cliente
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-[14px] leading-5 text-slate-700">
                    {customerNote || "Sin indicaciones adicionales."}
                  </div>
                </div>
              </div>

              {isCourierFlow ? (
                <div className="mt-3 rounded-[20px] border border-slate-200 bg-white p-1.5">
                  <button
                    type="button"
                    onClick={() => setOpenDescription((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 rounded-[16px] bg-slate-50 px-3 py-2 text-left"
                  >
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                        {formatPackageLabel(order)}
                      </div>
                      <div className="mt-0.5 text-[13px] font-black text-slate-900">
                        Ver detalles del servicio
                      </div>
                    </div>

                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[18px] font-black text-slate-700 ring-1 ring-slate-200">
                      {openDescription ? "−" : "+"}
                    </span>
                  </button>

                  {openDescription ? (
                    <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="whitespace-pre-wrap text-[14px] leading-5 text-slate-700">
                        {packageDescription || "Sin descripción adicional."}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
{serviceMeta.showDestinationButton && (
              <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-1.5">
                
                <button
                  type="button"
                  onClick={() => setOpenDestination((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 rounded-[16px] bg-slate-50 px-3 py-2 text-left"
                >
                  <div className="text-[15px] font-black text-slate-800">
                    📌 {serviceMeta.destinationLabel}
                  </div>

                  <div className="text-[20px] font-black leading-none text-slate-700">
                    {openDestination ? "−" : "📍"}
                  </div>
                </button>
                

                {openDestination ? (
                  <div className="mt-3 space-y-2">
                    {routeDestinations.length ? (
                      routeDestinations.map((item, index) => {
                        const active = selectedDestinationIndex === index;

                        return (
                          <label
                            key={`${item.address}-${index}`}
                            className={[
                              "flex cursor-pointer items-start gap-3 rounded-[18px] border px-3 py-3",
                              active
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-slate-200 bg-slate-50",
                            ].join(" ")}
                          >
                            <input
                              type="radio"
                              name="destinationSelectEnRoute"
                              className="mt-1 h-4 w-4 accent-emerald-600"
                              checked={active}
                              onChange={() => setSelectedDestinationIndex(index)}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] font-extrabold text-slate-900">
                                {item.label}
                              </div>
                              <div className="mt-1 break-words text-[13px] leading-5 text-slate-700">
                                {item.address || "Dirección no disponible"}
                              </div>
                              {item.reference ? (
                                <div className="mt-1 text-[12px] leading-4 text-slate-500">
                                  Referencia: {item.reference}
                                </div>
                              ) : null}
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-600">
                        Dirección no disponible.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              )}

              {order.customerPhone ? (
                <a
                  href={`tel:${order.customerPhone}`}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[20px] border border-emerald-200 bg-emerald-50 py-3 text-[15px] font-extrabold text-emerald-800 hover:bg-emerald-100"
                >
                  <img src="/icons/phone-green.png" alt="Llamar" className="h-5 w-5" />
                  Llamar
                </a>
              ) : null}

              {err ? (
                <div className="mt-3 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
                  ❌ {err}
                </div>
              ) : null}

              {serviceMeta.showDestinationButton && (
  <button
    onClick={handleNavigateDestination}
    className="mt-4 w-full rounded-[20px] bg-blue-600 py-3 text-[15px] font-extrabold text-white hover:bg-blue-700"
  >
    {serviceMeta.navigateText}
  </button>
)}

              <button
                disabled={delivering}
                onClick={handleDelivered}
                className="mt-3 w-full rounded-[20px] bg-emerald-600 py-3 text-[15px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {delivering ? "Procesando..." : serviceMeta.deliveredText}
              </button>

              <div className="mt-3 rounded-[18px] bg-slate-100 px-4 py-3 text-center text-[14px] font-semibold text-slate-700">
                {serviceMeta.footerText}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }