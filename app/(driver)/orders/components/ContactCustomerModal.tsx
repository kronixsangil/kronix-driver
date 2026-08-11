// app/(driver)/orders/components/ContactCustomerModal.tsx
"use client";

import Image from "next/image";
import { useEffect } from "react";

type Props = {
  open: boolean;
  customerName?: string | null;
  phone?: string | null;
  onClose: () => void;
};

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 15);
}

function toWhatsAppPhone(value: string) {
  const phone = normalizePhone(value);
  if (!phone) return "";

  // Celular colombiano sin indicativo: 3001234567 -> 573001234567
  if (phone.length === 10 && phone.startsWith("3")) {
    return `57${phone}`;
  }

  return phone;
}

export default function ContactCustomerModal({
  open,
  customerName,
  phone,
  onClose,
}: Props) {
  const cleanPhone = normalizePhone(phone);
  const whatsappPhone = toWhatsAppPhone(cleanPhone);
  const displayName = String(customerName ?? "Cliente").trim() || "Cliente";

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const whatsappText = encodeURIComponent(
    `Hola ${displayName}, soy el trabajador asignado a tu servicio de KRONIX.`
  );

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center px-6">
      <button
        type="button"
        aria-label="Cerrar contacto del cliente"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[410px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.30)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-5 pb-5 pt-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-200/35 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-cyan-200/30 blur-2xl" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-white text-xl font-black text-slate-600 shadow-sm ring-1 ring-slate-200"
          >
            ×
          </button>

          <div className="relative z-10 text-center">
            <div className="relative mx-auto h-[54px] w-[170px]">
              <Image
                src="/branding/kronix/header-logo.png"
                alt="KroniX"
                fill
                className="object-contain"
                sizes="170px"
                priority
              />
            </div>

            <h3 className="mt-2 text-[20px] font-black leading-tight text-slate-900">
              Contactar cliente
            </h3>
            <p className="mx-auto mt-2 max-w-[310px] text-[13px] font-medium leading-5 text-slate-600">
              Comunícate con {displayName} para confirmar detalles del servicio.
            </p>
          </div>
        </div>

        <div className="px-4 pb-4 pt-4">
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              Número de contacto
            </div>
            <div className="mt-1 text-[18px] font-black text-slate-900">
              {cleanPhone || "No disponible"}
            </div>
          </div>

          {cleanPhone ? (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${cleanPhone}`}
                className="flex min-h-[92px] flex-col items-center justify-center rounded-[22px] border border-blue-200 bg-blue-50 px-3 py-4 text-center shadow-sm transition hover:bg-blue-100 active:scale-[0.99]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[24px] shadow-sm ring-1 ring-blue-100">
                  📞
                </span>
                <span className="mt-2 text-[14px] font-black text-blue-800">Llamar</span>
              </a>

              <a
                href={`https://wa.me/${whatsappPhone}?text=${whatsappText}`}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[92px] flex-col items-center justify-center rounded-[22px] border border-emerald-200 bg-emerald-50 px-3 py-4 text-center shadow-sm transition hover:bg-emerald-100 active:scale-[0.99]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[24px] shadow-sm ring-1 ring-emerald-100">
                  💬
                </span>
                <span className="mt-2 text-[14px] font-black text-emerald-800">WhatsApp</span>
              </a>
            </div>
          ) : (
            <div className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[13px] font-semibold leading-5 text-amber-900">
              Esta orden no tiene un teléfono de contacto disponible.
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-[20px] border border-slate-200 bg-white px-3 py-3 text-[14px] font-black text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
