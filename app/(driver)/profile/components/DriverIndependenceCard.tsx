//app\(driver)\profile\components\DriverIndependenceCard.tsx
"use client";

import { useEffect, useState } from "react";
import {
  DRIVER_INDEPENDENCE_LAST_UPDATED,
  DRIVER_INDEPENDENCE_VERSION,
} from "../../legal/driverIndependence";
import {
  checkDriverIndependenceStatus,
  hasDriverIndependenceLocal,
} from "../../lib/driverIndependenceLegal";
import DriverIndependenceModal from "./DriverIndependenceModal";

type Props = {
  autoOpen?: boolean;
  onAcceptedRedirect?: string;
};

export default function DriverIndependenceCard({
  autoOpen = false,
  onAcceptedRedirect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [checking, setChecking] = useState(true);

  async function refreshStatus() {
    setChecking(true);

    try {
      const ok = await checkDriverIndependenceStatus();
      setAccepted(ok);
      return ok;
    } catch {
      const localOk = hasDriverIndependenceLocal();
      setAccepted(localOk);
      return localOk;
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
      <DriverIndependenceModal
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
            Independencia conductor
          </div>

          <div className="mt-1 text-base font-extrabold text-gray-900">
            Acuerdo de Independencia
          </div>

          <div className="mt-1 text-[12px] text-gray-600">
            Autonomía operativa, no subordinación y relación independiente.
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
            {DRIVER_INDEPENDENCE_VERSION}
          </span>
        </div>

        <div className="mt-1 text-[12px] text-slate-600">
          Actualizado:{" "}
          <span className="font-bold text-slate-800">
            {DRIVER_INDEPENDENCE_LAST_UPDATED}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-md active:scale-[0.98]"
      >
        Ver acuerdo de independencia
      </button>
    </div>
  );
}