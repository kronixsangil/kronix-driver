//app\(driver)\profile\components\DriverTermsModal.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import {
  DRIVER_TERMS_LAST_UPDATED,
  DRIVER_TERMS_TEXT,
  DRIVER_TERMS_TITLE,
  DRIVER_TERMS_VERSION,
} from "../../legal/driverTerms";
import { apiFetch } from "../../../../lib/apiFetch";

type Props = {
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
};

export default function DriverTermsModal({ open, onClose, onAccepted }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  const paragraphs = useMemo(() => {
    return DRIVER_TERMS_TEXT.split("\n").filter((line) => line.trim().length > 0);
  }, []);

  if (!open) return null;

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;

    const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (isBottom) setReachedBottom(true);
  }

  async function acceptTerms() {
  try {
    const payload = {
      version: DRIVER_TERMS_VERSION,
      acceptedAt: new Date().toISOString(),
    };

    // Cache local UX
    localStorage.setItem(
      "kronix_driver_terms_acceptance",
      JSON.stringify(payload)
    );

    // Persistencia REAL backend
    await apiFetch("/legal/accept", {
      method: "POST",
      body: JSON.stringify({
        documentType: "DRIVER_TERMS",
        version: DRIVER_TERMS_VERSION,
        source: "DRIVER_APP",
      }),
    });

    onAccepted();
    onClose();
  } catch (err) {
    console.error(err);
    alert(
      "No fue posible registrar la aceptación legal. Verifica tu conexión e inténtalo nuevamente."
    );
  }
}

  const canAccept = reachedBottom && checked;

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-slate-950/55 px-3 pb-3 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-blue-100 bg-blue-50 px-5 pb-4 pt-5">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Documento legal KroniX
          </div>

          <h2 className="mt-2 text-[22px] font-black leading-6 text-slate-950">
            {DRIVER_TERMS_TITLE}
          </h2>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-blue-100">
              Versión: {DRIVER_TERMS_VERSION}
            </span>

            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-blue-100">
              Actualizado: {DRIVER_TERMS_LAST_UPDATED}
            </span>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[52vh] overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-700 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {paragraphs.map((p, index) => {
            const clean = p.replace(/^#+\s?/, "").trim();

            const isTitle =
              /^[0-9]+[\.\)]\s/.test(clean) ||
              clean.length < 90 && clean.toUpperCase() === clean;

            return (
              <p
                key={`${p}-${index}`}
                className={
                  isTitle
                    ? "mb-3 mt-5 text-[14px] font-black leading-5 text-slate-950"
                    : "mb-3 text-[13px] font-medium leading-5 text-slate-700"
                }
              >
                {clean}
              </p>
            );
          })}

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
            Has llegado al final del documento.
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          {!reachedBottom ? (
            <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-800">
              Desplázate hasta el final del documento para habilitar la aceptación.
            </div>
          ) : null}

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <input
              type="checkbox"
              checked={checked}
              disabled={!reachedBottom}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 h-4 w-4 accent-emerald-600"
            />

            <span className="text-xs font-semibold leading-5 text-slate-700">
              Declaro que he leído, comprendido y acepto los Términos y
              Condiciones para Conductores KroniX.
            </span>
          </label>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm"
            >
              Cerrar
            </button>

            <button
              type="button"
              disabled={!canAccept}
              onClick={acceptTerms}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-md ${
                canAccept ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}