//app/(driver)/components/AvailableOrderCard.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { CustomerBehaviorIndicator, GeoPoint } from "../../lib/types";
import { getAvailableServiceMeta, getOrderServiceType } from "../../lib/serviceConfig";

type AvailableOrder = {
  orderId: string;
  stores: { storeId: string; name: string }[];
  distanceKm: number;
  deliveryFee: number;
  tip?: number;

  pickupLocations?: GeoPoint[];
  pickupLocation?: GeoPoint;
  dropoffLocation?: GeoPoint;

  routeAddresses?: string[];
  customerAddress?: string;
  customerNote?: string;
  customer?: {
    id?: string;
    name?: string;
    nickname?: string;
    behavior?: CustomerBehaviorIndicator | null;
  };
  customerBehavior?: CustomerBehaviorIndicator | null;

  status?: string;
  flowStatus?: string;
  orderType?: string | null;
  serviceType?: "STORE" | "DELIVERY" | "PACKAGE" | "TAXI" | "MOTORCARGO" | string | null;
  requiredWorkerType?: "MOTORCYCLE" | "TAXI" | "MOTORCARGO" | string | null;
  workerCommissionCOP?: number | null;
  courierServiceType?: "PICKUP_AND_DELIVERY" | "SEND_PACKAGE" | "ERRAND" | string | null;

  [k: string]: unknown;
};

function formatCOP(value: number) {
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}


function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getLat(point: unknown): number | null {
  if (!point || typeof point !== "object") return null;
  const p = point as Record<string, unknown>;
  return toNumber(p.lat ?? p.latitude);
}

function getLng(point: unknown): number | null {
  if (!point || typeof point !== "object") return null;
  const p = point as Record<string, unknown>;
  return toNumber(p.lng ?? p.lon ?? p.longitude);
}

function readPointFromObject(value: unknown): { lat: number; lng: number } | null {
  if (!value || typeof value !== "object") return null;

  const obj = value as Record<string, unknown>;

  const lat = toNumber(
    obj.lat ??
      obj.latitude ??
      obj.pickupLat ??
      obj.pickupLatitude ??
      obj.originLat ??
      obj.originLatitude
  );

  const lng = toNumber(
    obj.lng ??
      obj.lon ??
      obj.longitude ??
      obj.pickupLng ??
      obj.pickupLon ??
      obj.pickupLongitude ??
      obj.originLng ??
      obj.originLon ??
      obj.originLongitude
  );

  if (
    lat !== null &&
    lng !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  ) {
    return { lat, lng };
  }

  const coordinates = obj.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    /*
      Formato común GeoJSON: [lng, lat].
      Algunos servicios guardan [lat, lng], por eso validamos rangos.
    */
    const first = toNumber(coordinates[0]);
    const second = toNumber(coordinates[1]);

    if (first !== null && second !== null) {
      if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
        return { lat: first, lng: second };
      }

      if (Math.abs(second) <= 90 && Math.abs(first) <= 180) {
        return { lat: second, lng: first };
      }
    }
  }

  return null;
}

function getOrderPickupPoint(order: AvailableOrder): { lat: number; lng: number } | null {
  const direct = readPointFromObject(order);
  if (direct) return direct;

  const pickupLocations = Array.isArray(order.pickupLocations)
    ? order.pickupLocations
    : [];

  for (const pickup of pickupLocations) {
    const point = readPointFromObject(pickup);
    if (point) return point;
  }

  const candidates = [
    order.pickupLocation,
    (order as any).pickup,
    (order as any).pickupPoint,
    (order as any).pickupCoordinates,
    (order as any).originLocation,
    (order as any).origin,
    (order as any).originPoint,
    (order as any).fromLocation,
    (order as any).from,
    (order as any).customerLocation,
    (order as any).customerAddressLocation,
    (order as any).addressLocation,
    (order as any).startLocation,
    (order as any).start,
  ];

  for (const candidate of candidates) {
    const point = readPointFromObject(candidate);
    if (point) return point;
  }

  const stops = (order as any).stops ?? (order as any).routeStops ?? (order as any).serviceStops;
  if (Array.isArray(stops)) {
    for (const stop of stops) {
      const point = readPointFromObject(stop);
      if (point) return point;

      const nested = readPointFromObject((stop as any)?.location ?? (stop as any)?.point);
      if (nested) return nested;
    }
  }

  const routePoints = (order as any).routePoints ?? (order as any).points;
  if (Array.isArray(routePoints)) {
    for (const routePoint of routePoints) {
      const point = readPointFromObject(routePoint);
      if (point) return point;
    }
  }

  return null;
}
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatKm(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (value < 10) return `${value.toFixed(1)} km`;
  return `${Math.round(value)} km`;
}

function getWorkerServiceCharge(order: AvailableOrder) {
  const direct = toNumber(order.workerCommissionCOP);
  return direct !== null && direct > 0 ? direct : 0;
}


function buildStoreTitle(order: AvailableOrder) {
  const stores = Array.isArray(order.stores) ? order.stores : [];
  const serviceType = getOrderServiceType(order);

  if (stores.length === 1) return stores[0].name || "Pedido";
  if (stores.length > 1) {
    const first = stores[0].name || "Pedido";
    return `${first} + ${stores.length - 1}`;
  }

  if (serviceType === "STORE") return "Tienda en línea";
  if (serviceType === "PACKAGE") return "KroniX Envíos";
  if (serviceType === "DELIVERY") return "Domicilio Express";
  if (serviceType === "TAXI") return "Taxi";
  if (serviceType === "MOTORCARGO") return "Motocarga";

  return "Servicio KroniX";
}

function buildPickupsLabel(stores: { name: string }[]) {
  const n = stores?.length ?? 0;
  if (n <= 1) return null;
  return `${n} recogidas`;
}

function getBadge(order: AvailableOrder) {
  const status = String(order.status ?? "").toUpperCase();
  const flow = String(order.flowStatus ?? "").toUpperCase();
  const key = flow || status;

  if (key === "PAYMENT_PENDING" || key === "WAITING_CONFIRMATION" || key === "STORE_CONFIRMED") {
    return {
      text: "AÚN NO LISTO",
      className: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    };
  }

  if (key === "EN_ROUTE" || status === "ASSIGNED") {
    return {
      text: "YA ASIGNADO",
      className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    };
  }

  return {
    text: "DISPONIBLE",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  };
}

function getCustomerDisplayName(order: AvailableOrder) {
  const nickname = String(order.customer?.nickname ?? "").trim();
  if (nickname) return nickname;
  return String(order.customer?.name ?? "").trim() || "Cliente";
}

function getCustomerBehavior(order: AvailableOrder) {
  return order.customerBehavior ?? order.customer?.behavior ?? null;
}

function behaviorTone(level?: string | null) {
  if (level === "VERY_RELIABLE") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (level === "RELIABLE") return "border-blue-200 bg-blue-50 text-blue-800";
  if (level === "DEVELOPING") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function AccordionRow({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200"
    >
      <div className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
        {title}
      </div>

      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-base font-extrabold text-slate-700 ring-1 ring-slate-200">
        {open ? "−" : "+"}
      </span>
    </button>
  );
}

export default function AvailableOrderCard({
  order,
  expanded,
  onToggle,
  onAccept,
  accepting,
}: {
  order: AvailableOrder;
  expanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  accepting?: boolean;
}) {
  const [openRoute, setOpenRoute] = useState(false);
  const [driverPoint, setDriverPoint] = useState<{ lat: number; lng: number } | null>(null);

  const title = buildStoreTitle(order);
  const customerName = getCustomerDisplayName(order);
  const customerBehavior = getCustomerBehavior(order);
  const pickupsLabel = buildPickupsLabel(order.stores ?? []);
  const fallbackKm = Number(order.distanceKm ?? 0);
  const tip = Number(order.tip ?? 0);
  const deliveryFee = Number(order.deliveryFee ?? 0);
  const workerServiceCharge = getWorkerServiceCharge(order);

  const serviceMeta = getAvailableServiceMeta(order);

  const serviceType = getOrderServiceType(order);

  const isStoreOrder = serviceType === "STORE";
  const isPointOnlyService = serviceType === "DELIVERY" || serviceType === "TAXI" || serviceType === "MOTORCARGO";

  const showServiceDetails = isStoreOrder;
  const showRouteSection = !isPointOnlyService;

  const note =
    typeof order.customerNote === "string"
      ? order.customerNote
      : typeof (order as any).notes === "string"
        ? String((order as any).notes)
        : "";

  const cleanNote = note.trim();
  const serviceMessage =
    cleanNote ||
    "Cliente solicita tu servicio en la dirección mostrada, dirígete allí lo más pronto posible.";

  const route = useMemo(() => {
    return Array.isArray(order.routeAddresses) && order.routeAddresses.length
      ? order.routeAddresses
      : [order.pickupLocation?.address, order.dropoffLocation?.address].filter(Boolean);
  }, [order.routeAddresses, order.pickupLocation?.address, order.dropoffLocation?.address]);


  const pickupPoint = useMemo(() => getOrderPickupPoint(order), [order]);

  useEffect(() => {
    // Servicios: calcular distancia Worker → punto de recogida desde que la tarjeta aparece.
    // Tienda en Línea: conservar exactamente el comportamiento previo.
    if (isStoreOrder && !expanded) return;
    if (!pickupPoint) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setDriverPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        if (cancelled) return;
        setDriverPoint(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, [expanded, pickupPoint, isStoreOrder]);

  const pickupDistanceKm = useMemo(() => {
    /*
      IMPORTANTE:
      - Tienda en Línea NO se modifica: conserva la distancia que llega en la orden.
      - Servicios KroniX intentan calcular distancia desde el Worker hasta el punto de recogida.
    */
    if (isStoreOrder) {
      return Number.isFinite(fallbackKm) ? fallbackKm : 0;
    }

    if (driverPoint && pickupPoint) {
      return haversineKm(driverPoint, pickupPoint);
    }

    if (Number.isFinite(fallbackKm) && fallbackKm > 0) {
      return fallbackKm;
    }

    return null;
  }, [driverPoint, pickupPoint, fallbackKm, isStoreOrder]);

  const distanceLabel = formatKm(pickupDistanceKm);
  const amountPillLabel = isStoreOrder
    ? `Envío ${formatCOP(deliveryFee)}`
    : workerServiceCharge > 0
      ? `Comisión ${formatCOP(workerServiceCharge)}`
      : "Comisión por confirmar";

  const addr =
    typeof order.customerAddress === "string" && order.customerAddress.trim()
      ? order.customerAddress
      : order.dropoffLocation?.address ?? "";

  const badge = getBadge(order);

  const onToggleLocal = () => {
    if (expanded) {
      setOpenRoute(false);
    }
    onToggle();
  };

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-[14px] shadow-[0_8px_18px_rgba(15,23,42,0.07)]">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${serviceMeta.panelTone}`}
      />

      <button
        type="button"
        onClick={onToggleLocal}
        className="relative z-10 block w-full text-left"
        aria-expanded={expanded}
      >
        <div className="grid grid-cols-[1fr_104px] gap-3">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <div className="mt-[2px] flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
                <Image
                  src="/branding/kronix/logoorder.png"
                  alt="KroniX"
                  width={30}
                  height={30}
                  className="object-contain scale-[1.02]"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">                    
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-[5px] text-[14px] font-extrabold leading-none ${serviceMeta.tone}`}
                      >
                        {serviceMeta.label}
                      </span>

                      {pickupsLabel ? (
                        <div className="text-[11px] font-semibold text-slate-600">{pickupsLabel}</div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500">
                  ID:
                  <span className="ml-1 font-medium">{order.orderId}</span>
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-[6px] text-[12px] font-bold leading-none text-slate-700 ring-1 ring-slate-200 shadow-sm">
                    {amountPillLabel}
                  </span>

                  {tip > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-[6px] text-[12px] font-bold leading-none text-emerald-700 ring-1 ring-emerald-200 shadow-sm">
                      + {formatCOP(tip)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-full min-h-[92px] flex-col items-end justify-between">
            <span
              className={`shrink-0 rounded-full px-3 py-[6px] text-[11px] font-extrabold leading-none ${badge.className}`}
            >
              {badge.text}
            </span>

            <div className={`relative ${serviceMeta.imageWrap} shrink-0`}>
              <Image
                src={serviceMeta.imageSrc}
                alt={serviceMeta.imageAlt}
                fill
                sizes="104px"
                className={serviceMeta.imageClassName}
              />
            </div>
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="relative z-10 mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
          <div className="space-y-3 text-sm text-slate-700">
                        {showServiceDetails ? (
              <>
                
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                    Establecimientos
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {(order.stores ?? []).map((s) => s.name).join(" · ") || "—"}
                  </p>
                </div>
              </>
            ) : null}

                        {showRouteSection ? (
              <div className="space-y-2">
                <AccordionRow
                  title="Ruta (direcciones en orden)"
                  open={openRoute}
                  onToggle={() => setOpenRoute((v) => !v)}
                />

                {openRoute ? (
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200">
                    {route.length ? (
                      <ol className="space-y-1">
                        {route.map((a, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
                              {i + 1}
                            </span>
                            <span className="text-sm text-slate-700">{a}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-slate-600">—</p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-gray-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">Cliente</p>
                  <p className="mt-1 truncate text-sm font-extrabold text-slate-900">{customerName}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${behaviorTone(customerBehavior?.level)}`}>
                  {customerBehavior?.levelLabel ?? "Cliente nuevo"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-slate-50 px-2 py-2 text-center">
                  <div className="text-[9px] font-bold uppercase text-slate-500">Confiabilidad</div>
                  <div className="mt-1 text-xs font-black">
                    {customerBehavior?.reliabilityPct != null ? `${customerBehavior.reliabilityPct.toFixed(1)}%` : "Nuevo"}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-2 text-center">
                  <div className="text-[9px] font-bold uppercase text-slate-500">Calificación</div>
                  <div className="mt-1 text-xs font-black">
                    ⭐ {customerBehavior?.rating != null ? customerBehavior.rating.toFixed(2) : "—"}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-2 text-center">
                  <div className="text-[9px] font-bold uppercase text-slate-500">Servicios</div>
                  <div className="mt-1 text-xs font-black">{customerBehavior?.totalEvaluatedServices ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                Dirección del cliente
              </p>
              <p className="mt-1 text-sm text-slate-700">{addr || "—"}</p>
            </div>

            <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                {cleanNote ? "Comentario del cliente" : "Información del servicio"}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {serviceMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={accepting}
            onClick={onAccept}
            className="mt-3 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {accepting ? "Aceptando..." : "Aceptar pedido"}
          </button>

          <div className="mt-1 text-center text-[11px] text-slate-500">
            Al aceptar, el pedido pasará a tu flujo de recogida.
          </div>
        </div>
      ) : null}
    </div>
  );
}