//app/(driver)/components/AssignedOrderCard.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { openMapsNavigation } from "../../lib/openMaps";
import type { DriverOrder } from "../../lib/types";

interface Props {
  order: DriverOrder;
  onArrived?: () => void | Promise<void>;
  onCancel?: () => void;
  cancelling?: boolean;
  readyPickupStoreNames?: string[];
}

function normalizeName(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function getCourierType(order: DriverOrder) {
  return String(order.courierServiceType ?? "").trim().toUpperCase();
}

function getPickupPointTitle(order: DriverOrder) {
  const type = getCourierType(order);
  if (type === "ERRAND") return "Punto inicial";
  if (type === "SEND_PACKAGE") return "Punto de recogida";
  if (type === "PICKUP_AND_DELIVERY") return "Punto de recogida";
  return "Recogidas";
}

function getServiceMeta(order: DriverOrder) {
  const serviceType = getCourierType(order);

  if (serviceType === "SEND_PACKAGE") {
    return {
      label: "KroniX Envíos",
      imageSrc: "/branding/kronix/card-moto.png",
      imageAlt: "Paquete",
      tone: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
      heroTone: "from-cyan-50 via-white to-sky-50",
      headerTitle: "Dirígete al punto de recogida",
      navigateText: "Navegar al punto de recogida",
      arrivedText: "Llegué al punto de recogida",
      readySingleText: "Ya puede iniciar con el servicio.",
      footerText: "Este servicio ya está reservado para ti.",
    };
  }

  if (serviceType === "ERRAND") {
    return {
      label: "Domicilios y Diligencias",
      imageSrc: "/branding/kronix/check-list.png",
      imageAlt: "Diligencia",
      tone: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
      heroTone: "from-violet-50 via-white to-emerald-50",
      headerTitle: "Dirígete al punto inicial",
      navigateText: "Navegar al punto inicial",
      arrivedText: "Llegué al punto inicial",
      readySingleText: "Ya puede iniciar con el servicio.",
      footerText: "El servicio quedó reservado para ti.",
    };
  }

  if (serviceType === "PICKUP_AND_DELIVERY") {
    return {
      label: "Domicilio Express",
      imageSrc: "/branding/kronix/card-moto.png",
      imageAlt: "Mensajería",
      tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      heroTone: "from-emerald-50 via-white to-cyan-50",
      headerTitle: "Dirígete al punto de recogida",
      navigateText: "Navegar al punto de recogida",
      arrivedText: "Llegué al punto de recogida",
      readySingleText: "Ya puede iniciar con el servicio.",
      footerText: "Este servicio ya está reservado para ti.",
    };
  }

  return {
    label: "Tienda en línea",
    imageSrc: "/branding/kronix/card-comprar.png",
    imageAlt: "Tienda en línea",
    tone: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    heroTone: "from-blue-50 via-white to-emerald-50",
    headerTitle: "Dirígete al negocio",
    navigateText: "Navegar al negocio",
    arrivedText: "Llegué al negocio",
    readySingleText: "ya tiene el pedido listo.",
    footerText: "Este pedido ya está reservado para ti.",
  };
}

function formatPackageLabel(order: DriverOrder) {
  const type = getCourierType(order);
  if (type === "ERRAND") return "Descripción del servicio";
  return "Descripción del paquete";
}

export default function AssignedOrderCard({
  order,
  onArrived,
  onCancel,
  cancelling,
  readyPickupStoreNames = [],
}: Props) {
  const pickups = useMemo(() => order.pickupLocations ?? [], [order.pickupLocations]);
  const hasMultiple = pickups.length > 1;
  const isCourierFlow = !!getCourierType(order);

  const [selectedPickupIndex, setSelectedPickupIndex] = useState<number | null>(
    hasMultiple ? null : pickups.length ? 0 : null
  );
  const [openPickupAccordion, setOpenPickupAccordion] = useState(false);
const [openDescriptionAccordion, setOpenDescriptionAccordion] = useState(false);
const [arriving, setArriving] = useState(false);

  useEffect(() => {
    if (pickups.length === 0) setSelectedPickupIndex(null);
    else if (pickups.length === 1) setSelectedPickupIndex(0);
    else setSelectedPickupIndex(null);
  }, [pickups.length]);

  const selectedPickup =
    selectedPickupIndex !== null ? pickups[selectedPickupIndex] : pickups[0] ?? null;

  const storeNames = String(order.storeName ?? "")
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);

  const storeContacts = order.storesContacts ?? [];
  const serviceMeta = getServiceMeta(order);

  const readySet = useMemo(
    () => new Set((readyPickupStoreNames ?? []).map((name) => normalizeName(name)).filter(Boolean)),
    [readyPickupStoreNames]
  );

  const readyCount = readySet.size;
  const km = Number(order.distanceKm ?? 0);
  const payout = Number(order.payout ?? 0);
  const packageDescription = String((order as any)?.packageDescription ?? "").trim();

  const selectedPickupAny = selectedPickup as any;
  const pickupPlaceName = String(selectedPickupAny?.placeName ?? "").trim();
  const pickupReference = String(selectedPickupAny?.reference ?? "").trim();

  const handleNavigatePickup = () => {
    if (!selectedPickup) return;

    const address = String(selectedPickup?.address ?? "").trim();
    if (address) {
      openMapsNavigation(address);
      return;
    }

    if (
      Number.isFinite(Number(selectedPickup?.lat)) &&
      Number.isFinite(Number(selectedPickup?.lng))
    ) {
      openMapsNavigation(Number(selectedPickup.lat), Number(selectedPickup.lng), "Recogida");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-0 py-0">
      <div className="mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className={`relative overflow-hidden bg-gradient-to-br ${serviceMeta.heroTone} px-4 pt-4 pb-4`}>
            <div className="pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative z-10">
  <div className="pointer-events-none absolute left-[-2px] top-[-10px]">
    <div className="relative h-[80px] w-[80px]">
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
    <div className="flex w-full justify-start pl-[56px]">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[16px] font-extrabold ${serviceMeta.tone}`}
      >
        {serviceMeta.label}
      </span>
    </div>

    <p className="mt-2 w-full text-center text-[14px] font-black uppercase leading-[1.05] text-slate-600">
      ASIGNADO
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
            {readyCount > 0 ? (
              <div className="mb-4 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                  Listo para recoger
                </div>
                <div className="mt-1 text-[14px] font-bold text-emerald-900">
                  {readyCount === 1
                    ? `${readyPickupStoreNames[0]} ${serviceMeta.readySingleText}`
                    : `${readyCount} puntos ya están listos para continuar.`}
                </div>
              </div>
            ) : null}

            {isCourierFlow ? (
  <div className="mt-3 rounded-[20px] border border-slate-200 bg-white p-1.5">
    <button
      type="button"
      onClick={() => setOpenDescriptionAccordion((v) => !v)}
      className="flex w-full items-center justify-between gap-3 rounded-[16px] bg-slate-50 px-3 py-2 text-left"
    >
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
          {formatPackageLabel(order)}
        </div>
        <div className="mt-0.5 text-[13px] font-bold text-slate-800">
          {openDescriptionAccordion ? "Ocultar detalles" : "Ver detalles del servicio"}
        </div>
      </div>

      <div className="inline-flex h-8 w-8 items-center justify-center rounded-[12px] bg-white text-[18px] font-black text-slate-700 ring-1 ring-slate-200">
        {openDescriptionAccordion ? "−" : "+"}
      </div>
    </button>

    {openDescriptionAccordion ? (
      <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="whitespace-pre-wrap text-[14px] leading-5 text-slate-700">
          {packageDescription || "Sin descripción adicional."}
        </div>
      </div>
    ) : null}
  </div>
) : null}

            <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Indicaciones del cliente
              </div>
              <div className="mt-2 whitespace-pre-wrap text-[14px] leading-5 text-slate-700">
                {order.customerNote?.trim() || "Sin indicaciones adicionales."}
              </div>
            </div>

            {isCourierFlow ? (
              <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-1.5">
                <button
                  type="button"
                  onClick={() => setOpenPickupAccordion((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 rounded-[16px] bg-slate-50 px-3 py-1.5 text-left"
                >
                  <div className="text-[15px] font-black text-slate-800">
                    📌{getPickupPointTitle(order)}
                  </div>
                  <div className="text-[20px] font-black leading-none text-slate-700">
                    {openPickupAccordion ? "−" : "📍"}
                  </div>
                </button>

                {openPickupAccordion ? (
                  <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-[18px]">📍</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-extrabold text-slate-900">
                          {pickupPlaceName || getPickupPointTitle(order)}
                        </div>
                        <div className="mt-1 break-words text-[14px] leading-5 text-slate-700">
                          {String(selectedPickup?.address ?? "").trim() || "Dirección no disponible"}
                        </div>
                        {pickupReference ? (
                          <div className="mt-1 text-[12px] leading-4 text-slate-500">
                            Referencia: {pickupReference}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[15px] font-black text-slate-900">Recogidas</p>
                  <span className="text-[11px] text-slate-500">{pickups.length} punto(s)</span>
                </div>

                <div className="space-y-2">
                  {pickups.map((p, idx) => {
                    const active = selectedPickupIndex === idx;
                    const phone1 = storeContacts[idx]?.phone1?.trim();
                    const currentStoreName = storeNames[idx] ?? "Punto";
                    const isReady = readySet.has(normalizeName(currentStoreName));

                    return (
                      <label
                        key={`${p.address ?? "pickup"}-${idx}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-[18px] border px-3 py-3 ${
                          active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pickupSelectAssigned"
                          className="mt-1 h-4 w-4 accent-emerald-600"
                          checked={active}
                          onChange={() => setSelectedPickupIndex(idx)}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] font-extrabold text-slate-900">
                              {idx + 1}. {currentStoreName}
                            </p>
                            {isReady ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                                LISTO
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 break-words text-[13px] leading-5 text-slate-700">
                            {p.address || "Dirección no disponible"}
                          </p>
                        </div>

                        {phone1 ? (
                          <a
                            href={`tel:${phone1}`}
                            className="shrink-0 rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                            title="Llamar"
                          >
                            <img src="/icons/phone-green.png" alt="Llamar" className="h-5 w-5" />
                          </a>
                        ) : null}
                      </label>
                    );
                  })}
                </div>

                {hasMultiple ? (
                  <p className="mt-2 text-[11px] leading-4 text-slate-500">
                    Selecciona el punto al que vas antes de abrir Maps.
                  </p>
                ) : null}
              </div>
            )}

            <button
              onClick={handleNavigatePickup}
              disabled={!selectedPickup}
              className="mt-4 w-full rounded-[20px] bg-blue-600 py-3 text-[15px] font-extrabold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {serviceMeta.navigateText}
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!onArrived || arriving) return;

                setArriving(true);

                const minMs = 500;
                const t0 = Date.now();

                try {
                  await Promise.resolve(onArrived());
                } catch (e) {
                  console.error("[driver] onArrived failed:", e);
                } finally {
                  const elapsed = Date.now() - t0;
                  const wait = Math.max(0, minMs - elapsed);
                  setTimeout(() => setArriving(false), wait);
                }
              }}
              disabled={!onArrived || arriving}
              className="mt-3 w-full rounded-[20px] bg-emerald-600 py-3 text-[15px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {arriving ? "Procesando..." : serviceMeta.arrivedText}
            </button>

            <button
              onClick={onCancel}
              disabled={!onCancel || cancelling}
              className="mt-3 w-full rounded-[20px] border border-red-200 bg-white py-3 text-[15px] font-extrabold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {cancelling ? "Cancelando..." : "Cancelar pedido"}
            </button>

            <div className="mt-3 rounded-[18px] bg-emerald-50 px-4 py-3 text-center text-[14px] font-semibold text-emerald-700">
              {serviceMeta.footerText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}