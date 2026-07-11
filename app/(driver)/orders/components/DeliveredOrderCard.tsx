//app/(driver)/orders/components/DeliveredOrderCard.tsx
"use client";

interface Props {
  order: {
    orderId: string;
    storeName: string;
    payout: number;
    courierServiceType?: string | null;
  };
  onBackToOrders?: () => void;
}

export default function DeliveredOrderCard({ onBackToOrders }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 px-0 py-0">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className="p-4">
            <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-center text-[14px] font-bold leading-5 text-emerald-800">
              Ya puedes volver a pedidos y seguir disponible
              <br />
              para una nueva orden.
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
