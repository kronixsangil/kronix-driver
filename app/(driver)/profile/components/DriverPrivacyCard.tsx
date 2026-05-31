//app\(driver)\profile\components\DriverPrivacyCard.tsx
"use client";

import { useEffect, useState } from "react";
import {
  checkDriverPrivacyStatus,
  getCurrentDriverLegalDocument,
  DRIVER_PRIVACY_DOCUMENT_TYPE,
  type DriverLegalDocument,
} from "../../lib/driverPrivacyLegal";
import DriverPrivacyModal from "./DriverPrivacyModal";

type Props = {
  autoOpen?: boolean;
  onAcceptedRedirect?: string;
};

function formatLegalDate(value?: string | null) {
  if (!value) return "Legal Center";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "Legal Center";

  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

export default function DriverPrivacyCard({
  autoOpen = false,
  onAcceptedRedirect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [doc, setDoc] = useState<DriverLegalDocument | null>(null);

  async function refreshStatus() {
    setChecking(true);

    try {
      const currentDoc = await getCurrentDriverLegalDocument(
        DRIVER_PRIVACY_DOCUMENT_TYPE
      );

      setDoc(currentDoc);

      const ok = await checkDriverPrivacyStatus();
      setAccepted(ok);

      return ok;
    } catch {
      setDoc(null);
      setAccepted(false);
      return false;
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  useEffect(() => {
    if (!autoOpen) return;
    if (checking) return;
    if (accepted) return;

    setOpen(true);
  }, [autoOpen, checking, accepted]);

  async function handleAccepted() {
    const ok = await refreshStatus();

    if (ok && onAcceptedRedirect) {
      window.location.href = onAcceptedRedirect;
    }
  }

  if (open) {
    return (
      <DriverPrivacyModal
        open={open}
        onClose={() => setOpen(false)}
        onAccepted={handleAccepted}
      />
    );
  }

  return (
    <div className="mx-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Privacidad conductor
          </div>

          <div className="mt-1 text-base font-extrabold text-gray-900">
            {doc?.title || "Política de Privacidad"}
          </div>

          <div className="mt-1 text-[12px] text-gray-600">
            {doc?.description ||
              "Tratamiento de datos, GPS, documentos y seguridad."}
          </div>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${
            accepted
              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
              : "bg-amber-50 text-amber-700 ring-amber-100"
          }`}
        >
          {checking ? "..." : accepted ? "Aceptado" : "Pendiente"}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-[12px] text-slate-600">
          Versión vigente:{" "}
          <span className="font-bold text-slate-800">
            {doc?.version || "Cargando..."}
          </span>
        </div>

        <div className="mt-1 text-[12px] text-slate-600">
          Actualizado:{" "}
          <span className="font-bold text-slate-800">
            {formatLegalDate(doc?.updatedAt)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-md active:scale-[0.98]"
      >
        Ver política de privacidad
      </button>
    </div>
  );
}