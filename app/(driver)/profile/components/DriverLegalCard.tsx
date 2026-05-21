//app\(driver)\profile\components\DriverLegalCard.tsx
"use client";

import { useEffect, useState } from "react";
import {
  DRIVER_TERMS_LAST_UPDATED,
  DRIVER_TERMS_VERSION,
} from "../../legal/driverTerms";
import DriverTermsModal from "./DriverTermsModal";

export default function DriverLegalCard() {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  function refreshStatus() {
    try {
      const raw = localStorage.getItem("kronix_driver_terms_acceptance");
      const parsed = raw ? JSON.parse(raw) : null;
      setAccepted(parsed?.version === DRIVER_TERMS_VERSION);
    } catch {
      setAccepted(false);
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <>
      <div className="mx-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Legal conductor
            </div>

            <div className="mt-1 text-base font-extrabold text-gray-900">
              Términos y Condiciones
            </div>

            <div className="mt-1 text-[12px] text-gray-600">
              Documento obligatorio para operar en KroniX.
            </div>
          </div>

          <div
            className={`rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${
              accepted
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-amber-50 text-amber-700 ring-amber-100"
            }`}
          >
            {accepted ? "Aceptado" : "Pendiente"}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[12px] text-slate-600">
            Versión vigente:{" "}
            <span className="font-bold text-slate-800">
              {DRIVER_TERMS_VERSION}
            </span>
          </div>

          <div className="mt-1 text-[12px] text-slate-600">
            Actualizado:{" "}
            <span className="font-bold text-slate-800">
              {DRIVER_TERMS_LAST_UPDATED}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-md transition-all duration-200 active:scale-[0.98]"
        >
          Ver documento legal
        </button>
      </div>

      <DriverTermsModal
        open={open}
        onClose={() => setOpen(false)}
        onAccepted={refreshStatus}
      />
    </>
  );
}