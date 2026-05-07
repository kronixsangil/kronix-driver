//app/(driver)/orders/components/DeliveredOrderCard.tsx
"use client";

import Image from "next/image";

interface Props {
  order: {
    orderId: string;
    storeName: string;
    payout: number;
    courierServiceType?: string | null;
  };
  onBackToOrders?: () => void;
}

function getCourierType(order: Props["order"]) {
  return String(order.courierServiceType ?? "").trim().toUpperCase();
}

function getServiceMeta(order: Props["order"]) {
  const serviceType = getCourierType(order);

  if (serviceType === "SEND_PACKAGE") {
    return {
      serviceLabel: "KroniX Envíos",
      imageSrc: "/branding/kronix/endpoint.png",
      imageAlt: "Paquete entregado",
      infoTone: "border-cyan-200 bg-cyan-50 text-cyan-800",
      chipTone: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
      successTone: "border-cyan-200 bg-cyan-50 text-cyan-800",
      helperText: "Excelente trabajo. El paquete quedó registrado como entregado.",
    };
  }

  if (serviceType === "ERRAND") {
    return {
      serviceLabel: "Domicilios y Diligencias",
      imageSrc: "/branding/kronix/check-list.png",
      imageAlt: "Domicilio completado",
      infoTone: "border-violet-200 bg-violet-50 text-violet-800",
      chipTone: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
      successTone: "border-violet-200 bg-violet-50 text-violet-800",
      helperText: "Excelente trabajo. El domicilio quedó registrado como completado.",
    };
  }

  if (serviceType === "PICKUP_AND_DELIVERY") {
    return {
      serviceLabel: "Domicilio Express",
      imageSrc: "/branding/kronix/endpoint.png",
      imageAlt: "Domicilio finalizado",
      infoTone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      chipTone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      successTone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      helperText: "Excelente trabajo. El servicio quedó registrado como finalizado.",
    };
  }

  return {
    serviceLabel: "Tienda en línea",
    imageSrc: "/branding/kronix/endpoint.png",
    imageAlt: "Pedido entregado",
    infoTone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    chipTone: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    successTone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    helperText: "Excelente trabajo. El pedido quedó registrado como entregado.",
  };
}

export default function DeliveredOrderCard({ order, onBackToOrders }: Props) {
  const serviceMeta = getServiceMeta(order);

  return (
    <div className="min-h-screen bg-slate-50 px-0 py-0">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden bg-white px-4 pt-4 pb-4">
            <div className="pointer-events-none absolute inset-0 opacity-60" />

            <div className="relative z-10">
              <div className="pointer-events-none absolute left-[-15px] top-[-15px]">
                <div className="relative h-[100px] w-[100px]">
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
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${serviceMeta.chipTone}`}
                  >
                    {serviceMeta.serviceLabel}
                  </span>
                </div>

                <p className="mt-2 w-full text-center text-[14px] font-black uppercase leading-[1.05] text-slate-600">
                  COMPLETADO
                </p>

                <p className="mt-1 w-full text-center text-[18px] font-black leading-[1.05] text-slate-900">
                  Servicio finalizado
                </p>

                <p className="mt-2 w-full text-center text-[13px] leading-5 text-slate-600">
                  {serviceMeta.helperText}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                Pedido ID
              </div>
              <div className="mt-1 break-all font-mono text-[13px] font-semibold text-emerald-900">
                {order.orderId}
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Servicio
                </div>
                <div className="mt-2 text-[15px] font-black text-slate-900">
                  {serviceMeta.serviceLabel}
                </div>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  Pago estimado
                </div>
                <div className="mt-2 text-[18px] font-black text-slate-900">
                  ${Number(order.payout ?? 0).toLocaleString("es-CO")}
                </div>
              </div>
            </div>

            <div
              className={`mt-4 rounded-[18px] border px-4 py-3 text-center text-[14px] font-semibold ${serviceMeta.successTone}`}
            >
              Ya puedes volver a pedidos y seguir disponible para una nueva orden.
            </div>

            <button
              onClick={() => {
                onBackToOrders?.();
              }}
              className="mt-4 w-full rounded-[20px] bg-slate-900 py-3 text-[15px] font-extrabold text-white hover:bg-slate-800"
            >
              Volver a pedidos
            </button>

            <p className="mt-3 text-center text-[11px] leading-4 text-slate-500">
              El estado ya quedó sincronizado como entregado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
