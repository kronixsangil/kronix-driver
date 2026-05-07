//app/(driver)/orders/components/PickupOrderCard.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { driverUpdateOrderStatus } from "../../lib/driverOrderApi";
import type { DriverOrder } from "../../lib/types";
import ChecklistConfirmModal from "./ChecklistConfirmModal";

interface Props {
  order: DriverOrder;
  onPickedUp?: () => void;
  readyPickupStoreNames?: string[];
}

function normalizeName(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function getCourierType(order: DriverOrder) {
  return String(order.courierServiceType ?? "").trim().toUpperCase();
}

function getServiceMeta(order: DriverOrder) {
  const serviceType = getCourierType(order);

  if (serviceType === "SEND_PACKAGE") {
    return {
      label: "KroniX Envíos",
      imageSrc: "/branding/kronix/Enviar-Paquete1.png",
      imageAlt: "Paquete",
      tone: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
      heroTone: "from-cyan-50 via-white to-sky-50",
      headerTitle: "Confirma la recogida del paquete",
      pickedUpText: "Recogí el paquete",
      modalTitle: "Confirmación del paquete",
      modalDescription: "Verifica que recibiste correctamente el paquete antes de continuar al destino.",
      footerText: "Al confirmar, el servicio pasará a “En ruta”.",
    };
  }

  if (serviceType === "ERRAND") {
    return {
      label: "Domicilios y Diligencias",
      imageSrc: "/branding/kronix/check-list.png",
      imageAlt: "Diligencia",
      tone: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
      heroTone: "from-violet-50 via-white to-emerald-50",
      headerTitle: "Confirma el inicio de la diligencia",
      pickedUpText: "Continuar al destino",
      modalTitle: "Confirmación de la diligencia",
      modalDescription: "Asegúrate de que ya tienes todo lo necesario para continuar con la gestión.",
      footerText: "Al confirmar, la diligencia pasará a “En ruta”.",
    };
  }

  if (serviceType === "PICKUP_AND_DELIVERY") {
    return {
      label: "Domicilio Express",
      imageSrc: "/branding/kronix/card-moto.png",
      imageAlt: "Mensajería",
      tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      heroTone: "from-emerald-50 via-white to-cyan-50",
      headerTitle: "Confirma la recogida del encargo",
      pickedUpText: "Recogí el encargo",
      modalTitle: "Confirmación del encargo",
      modalDescription: "Marca las casillas para confirmar que ya recibiste correctamente el encargo.",
      footerText: "Al confirmar, el servicio pasará a “En ruta”.",
    };
  }

  return {
    label: "Tienda en línea",
    imageSrc: "/branding/kronix/card-comprar.png",
    imageAlt: "Tienda en línea",
    tone: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    heroTone: "from-blue-50 via-white to-emerald-50",
    headerTitle: "Confirma la recogida del pedido",
    pickedUpText: "Recogí el pedido",
    modalTitle: "Confirmación del pedido",
    modalDescription: "Marca las casillas para confirmar que ya recogiste correctamente el pedido.",
    footerText: "Al confirmar, el pedido pasará a “En ruta”.",
  };
}

function formatPackageLabel(order: DriverOrder) {
  const type = getCourierType(order);
  if (type === "ERRAND") return "Descripción del servicio";
  return "Descripción del paquete";
}

export default function PickupOrderCard({
  order,
  onPickedUp,
  readyPickupStoreNames = [],
}: Props) {
  const pickups = useMemo(() => order.pickupLocations ?? [], [order.pickupLocations]);
  const hasMultiple = pickups.length > 1;
  const isCourierFlow = !!getCourierType(order);

  const [selectedPickupIndex, setSelectedPickupIndex] = useState<number | null>(
    hasMultiple ? null : pickups.length ? 0 : null
  );

  useEffect(() => {
    if (pickups.length === 0) setSelectedPickupIndex(null);
    else if (pickups.length === 1) setSelectedPickupIndex(0);
    else setSelectedPickupIndex(null);
  }, [pickups.length]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const note = (order.customerNote ?? "").trim();
  const serviceMeta = getServiceMeta(order);
  const packageDescription = String((order as any)?.packageDescription ?? "").trim();

  const checks = useMemo(() => {
    const out: { id: string; label: string; required: boolean }[] = [];
    const serviceType = getCourierType(order);

    if (!serviceType) {
      if (pickups.length > 1) {
        out.push({
          id: "all_pickups",
          label: "He realizado todas las recogidas del pedido.",
          required: true,
        });
      }
      out.push({
        id: "products_ok",
        label: "Verifiqué que el pedido esté completo y en buen estado.",
        required: true,
      });
    } else if (serviceType === "SEND_PACKAGE") {
      out.push({
        id: "package_ok",
        label: "Verifiqué que el paquete corresponde al servicio solicitado.",
        required: true,
      });
      out.push({
        id: "package_state",
        label: "El paquete fue recibido en condiciones adecuadas.",
        required: true,
      });
    } else if (serviceType === "ERRAND") {
      out.push({
        id: "errand_ok",
        label: "Ya tengo en mi poder lo necesario para completar la diligencia.",
        required: true,
      });
    } else {
      out.push({
        id: "pickup_ok",
        label: "Ya recibí correctamente el encargo para llevar al destino.",
        required: true,
      });
    }

    if (note.length > 0) {
      out.push({
        id: "note_ok",
        label: "Leí todas las observaciones e indicaciones del cliente.",
        required: true,
      });
    }

    return out;
  }, [order, pickups.length, note.length]);

  const finalizePickedUp = async () => {
    if (working) return;
    setErr(null);
    setWorking(true);

    onPickedUp?.();

    try {
      const flow = String(order.flowStatus ?? "").toUpperCase();
      const status = String(order.status ?? "").toUpperCase();

      if (flow !== "EN_ROUTE" && status !== "EN_ROUTE") {
        const res = await driverUpdateOrderStatus(order.orderId, "EN_ROUTE");
        if (res && "ok" in res && !res.ok) {
          throw new Error("No se pudo actualizar a EN_ROUTE.");
        }
      }
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "No se pudo actualizar el estado. Reintenta.");
    } finally {
      setTimeout(() => setWorking(false), 200);
    }
  };

  const handlePickedUpClick = () => {
    if (checks.length === 0) {
      finalizePickedUp();
      return;
    }
    setConfirmOpen(true);
  };

  const storeNames = String(order.storeName ?? "")
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);

  const storeContacts = order.storesContacts ?? [];

  const readySet = useMemo(
    () => new Set((readyPickupStoreNames ?? []).map((name) => normalizeName(name)).filter(Boolean)),
    [readyPickupStoreNames]
  );

  const readyCount = readySet.size;
  const payout = Number(order.payout ?? 0);

  return (
    <div className="min-h-screen bg-slate-50 px-0 py-0">
      <div className="mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className={`relative overflow-hidden bg-gradient-to-br ${serviceMeta.heroTone} px-4 pt-4 pb-4`}>
            <div className="relative z-10">
                <div className="absolute right-1 top-0 z-20 text-right">
    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
      Pago
    </div>
    <div className="text-[17px] font-black leading-tight text-emerald-700">
      ${payout.toLocaleString("es-CO")}
    </div>
  </div>
  <div className="pointer-events-none absolute left-[-10px] top-[-20px]">
    <div className="relative h-[70px] w-[70px]">
      <Image
        src={serviceMeta.imageSrc}
        alt={serviceMeta.imageAlt}
        fill
        className="object-contain opacity-95"
        sizes="64px"
      />
    </div>
  </div>

  <div className="flex flex-col items-center text-center">
    <div className="flex w-full justify-start pl-[58px]">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[16px] font-extrabold ${serviceMeta.tone}`}
      >
        {serviceMeta.label}
      </span>
    </div>

    <p className="mt-2 w-full text-center text-[14px] font-black uppercase leading-[1.05] text-slate-600">
      RECOGIDA
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
                    ? `${readyPickupStoreNames[0]} confirmó que ya está listo.`
                    : `${readyCount} puntos ya están listos para continuar.`}
                </div>
              </div>
            ) : null}
            
            {isCourierFlow ? (
              <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  {formatPackageLabel(order)}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-[14px] leading-5 text-slate-700">
                  {packageDescription || "Sin descripción adicional."}
                </div>
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

            {err ? (
              <div className="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] font-semibold text-amber-900">
                ⚠️ {err}
              </div>
            ) : null}

            {!isCourierFlow ? (
              <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[15px] font-black text-slate-900">Puntos de recogida</p>
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
                          name="pickupSelectPickup"
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
            ) : null}

            <button
              onClick={handlePickedUpClick}
              disabled={working}
              className="mt-4 w-full rounded-[20px] bg-emerald-600 py-3 text-[15px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {working ? "Procesando..." : serviceMeta.pickedUpText}
            </button>

            <div className="mt-3 rounded-[18px] bg-emerald-50 px-4 py-3 text-center text-[14px] font-semibold text-emerald-700">
              {serviceMeta.footerText}
            </div>
          </div>
        </div>
      </div>

      <ChecklistConfirmModal
        open={confirmOpen}
        title={serviceMeta.modalTitle}
        description={serviceMeta.modalDescription}
        checks={checks}
        confirmText="Sí, continuar"
        cancelText="Volver"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await finalizePickedUp();
        }}
      />
    </div>
  );
}