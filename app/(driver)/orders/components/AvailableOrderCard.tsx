//app/(driver)/components/AvailableOrderCard.tsx
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { GeoPoint } from "../../lib/types";

type AvailableOrder = {
  orderId: string;
  stores: { storeId: string; name: string }[];
  distanceKm: number;
  deliveryFee: number;
  tip?: number;

  pickupLocation?: GeoPoint;
  dropoffLocation?: GeoPoint;

  routeAddresses?: string[];
  customerAddress?: string;
  customerNote?: string;

  status?: string;
  flowStatus?: string;
  orderType?: string | null;
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

function buildStoreTitle(order: AvailableOrder) {
  const stores = Array.isArray(order.stores) ? order.stores : [];
  const orderType = String(order.orderType ?? "").trim().toUpperCase();
  const serviceType = String(order.courierServiceType ?? "").trim().toUpperCase();

  if (stores.length === 1) return stores[0].name || "Pedido";
  if (stores.length > 1) {
    const first = stores[0].name || "Pedido";
    return `${first} + ${stores.length - 1}`;
  }

  if (orderType === "STORE") return "Tienda en linea";
  if (serviceType === "SEND_PACKAGE") return "KroniX Envíos";
  if (serviceType === "ERRAND") return "Domicilios y Diligencias";
  if (serviceType === "PICKUP_AND_DELIVERY") return "Domicilio Express";

  return "Pedido";
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

function getServiceMeta(order: AvailableOrder) {
  const orderType = String(order.orderType ?? "").trim().toUpperCase();
  const serviceType = String(order.courierServiceType ?? "").trim().toUpperCase();

  if (orderType === "STORE") {
    return {
      label: "Tienda en línea",
      tone: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
      panelTone: "from-blue-50/60 via-white to-emerald-50/60",
      imageSrc: "/branding/kronix/card-comprar.png",
      imageAlt: "Tienda en línea",
      imageWrap: "h-[72px] w-[92px]",
      imageClassName: "object-contain scale-[1.5] translate-x-[10px] translate-y-[2px]",
    };
  }

  if (serviceType === "SEND_PACKAGE") {
    return {
      label: "KroniX Envíos",
      tone: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
      panelTone: "from-cyan-50/60 via-white to-sky-50/60",
      imageSrc: "/branding/kronix/Enviar-Paquete1.png",
      imageAlt: "Paquete",
      imageWrap: "h-[74px] w-[88px]",
      imageClassName: "object-contain scale-[0.96] translate-x-[1px] translate-y-[4px]",
    };
  }

  if (serviceType === "ERRAND") {
    return {
      label: "Domis y Diligencias",
      tone: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
      panelTone: "from-violet-50/60 via-white to-emerald-50/60",
      imageSrc: "/branding/kronix/check-list.png",
      imageAlt: "Diligencia",
      imageWrap: "h-[74px] w-[82px]",
      imageClassName: "object-contain scale-[0.95] translate-x-0 translate-y-[2px]",
    };
  }

  if (serviceType === "PICKUP_AND_DELIVERY") {
    return {
      label: "Domi Express",
      tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      panelTone: "from-emerald-50/60 via-white to-cyan-50/60",
      imageSrc: "/branding/kronix/card-moto.png",
      imageAlt: "Mensajería",
      imageWrap: "h-[72px] w-[98px]",
      imageClassName: "object-contain scale-[1.5] translate-x-[-6px] translate-y-[6px]",
    };
  }

  return {
    label: "Servicio",
    tone: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
    panelTone: "from-slate-50/60 via-white to-slate-100/60",
    imageSrc: "/branding/kronix/kronix-icon.png",
    imageAlt: "Servicio",
    imageWrap: "h-[66px] w-[66px]",
    imageClassName: "object-contain scale-[0.9] translate-x-0 translate-y-0",
  };
}

function Chip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good";
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
      : "bg-slate-50 text-slate-700 ring-1 ring-slate-200";

  return (
    <div className={`rounded-xl px-3 py-2 text-xs ${cls}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-0.5 text-sm font-extrabold">{value}</div>
    </div>
  );
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
  const [openNote, setOpenNote] = useState(false);

  const title = buildStoreTitle(order);
  const pickupsLabel = buildPickupsLabel(order.stores ?? []);
  const km = Number(order.distanceKm ?? 0);
  const fee = Number(order.deliveryFee ?? 0);
  const tip = Number(order.tip ?? 0);

  const serviceMeta = getServiceMeta(order);

  const orderType = String(order.orderType ?? "").trim().toUpperCase();
  const serviceType = String(order.courierServiceType ?? "").trim().toUpperCase();

  const isStoreOrder = orderType === "STORE";
  const isCourierOrder = orderType === "COURIER";
  const isDomiExpress = serviceType === "PICKUP_AND_DELIVERY";

  const showServiceDetails = isStoreOrder;
  const showRouteSection = !isDomiExpress;

  const note =
    typeof order.customerNote === "string"
      ? order.customerNote
      : typeof (order as any).notes === "string"
        ? String((order as any).notes)
        : "";

  const route = useMemo(() => {
    return Array.isArray(order.routeAddresses) && order.routeAddresses.length
      ? order.routeAddresses
      : [order.pickupLocation?.address, order.dropoffLocation?.address].filter(Boolean);
  }, [order.routeAddresses, order.pickupLocation?.address, order.dropoffLocation?.address]);

  const addr =
    typeof order.customerAddress === "string" && order.customerAddress.trim()
      ? order.customerAddress
      : order.dropoffLocation?.address ?? "";

  const badge = getBadge(order);

  const onToggleLocal = () => {
    if (expanded) {
      setOpenRoute(false);
      setOpenNote(false);
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
                  src="/branding/kronix/kronix-icon.png"
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
                  Pedido ID:
                  <span className="ml-1 font-medium">{order.orderId}</span>
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-[6px] text-[12px] font-bold leading-none text-slate-700 ring-1 ring-slate-200 shadow-sm">
                    {km.toFixed(1)} km
                  </span>

                  <span className="inline-flex items-center rounded-full bg-white px-2.5 py-[6px] text-[12px] font-bold leading-none text-slate-700 ring-1 ring-slate-200 shadow-sm">
                    Envío {formatCOP(fee)}
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

            <div className="grid grid-cols-2 gap-2">
              <Chip label="Distancia total" value={`${km.toFixed(1)} km`} />
              <Chip label="Pago total" value={formatCOP(fee + tip)} tone="good" />
            </div>

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

            <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                Dirección del cliente
              </p>
              <p className="mt-1 text-sm text-slate-700">{addr || "—"}</p>
            </div>

            <div className="space-y-2">
              <AccordionRow
                title="Comentario del cliente"
                open={openNote}
                onToggle={() => setOpenNote((v) => !v)}
              />

              {openNote ? (
                <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200">
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{note || "—"}</p>
                </div>
              ) : null}
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