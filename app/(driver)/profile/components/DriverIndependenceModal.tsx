//app\(driver)\profile\components\DriverIndependenceModal.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import {
  DRIVER_INDEPENDENCE_LAST_UPDATED,
  DRIVER_INDEPENDENCE_TEXT,
  DRIVER_INDEPENDENCE_TITLE,
  DRIVER_INDEPENDENCE_VERSION,
} from "../../legal/driverIndependence";

import { acceptDriverIndependenceBackend } from "../../lib/driverIndependenceLegal";

type Props = {
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
};

export default function DriverIndependenceModal({
  open,
  onClose,
  onAccepted,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [reachedBottom, setReachedBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const paragraphs = useMemo(
    () =>
      DRIVER_INDEPENDENCE_TEXT.split("\n").filter(
        (line) => line.trim().length > 0
      ),
    []
  );

  if (!open) return null;

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;

    if (
      el.scrollTop + el.clientHeight >=
      el.scrollHeight - 24
    ) {
      setReachedBottom(true);
    }
  }

  async function handleAccept() {
    if (!reachedBottom || !checked || saving) return;

    setSaving(true);

    try {
      await acceptDriverIndependenceBackend();

      alert(
        "Gracias. El Acuerdo de Independencia fue aceptado correctamente."
      );

      onAccepted();
      onClose();
    } catch {
      alert(
        "No fue posible registrar la aceptación del acuerdo."
      );
    } finally {
      setSaving(false);
    }
  }

  const canAccept =
    reachedBottom && checked && !saving;

  return (
    <div className="mx-0 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-blue-100 bg-blue-50 px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-2xl">
            📑
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-black leading-5 text-slate-950">
              {DRIVER_INDEPENDENCE_TITLE}
            </h2>

            <div className="mt-3 flex flex-col gap-1.5">
              <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-700 ring-1 ring-blue-100">
                📄 Versión: {DRIVER_INDEPENDENCE_VERSION}
              </span>

              <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-700 ring-1 ring-blue-100">
                📅 Actualizado: {DRIVER_INDEPENDENCE_LAST_UPDATED}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-[48dvh] overflow-y-auto px-4 py-4 text-[12.5px] leading-5 text-slate-700 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {paragraphs.map((p, index) => {
          const clean = p.replace(/^#+\s?/, "").trim();

          const isTitle =
            clean.startsWith("BLOQUE") ||
            /^[0-9]+[\.\)]\s/.test(clean) ||
            (clean.length < 90 &&
              clean.toUpperCase() === clean);

          const isBullet =
            clean.startsWith("•") ||
            clean.startsWith("-");

          return (
            <p
              key={`${clean}-${index}`}
              className={
                isTitle
                  ? "mb-3 mt-5 text-[14px] font-black leading-5 text-slate-950 first:mt-0"
                  : isBullet
                  ? "mb-1.5 pl-2 text-[12.5px] font-semibold leading-5 text-slate-600"
                  : "mb-3 text-[12.5px] font-medium leading-5 text-slate-700"
              }
            >
              {clean}
            </p>
          );
        })}

        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-black text-emerald-800">
          ✅ Has llegado al final del documento.
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3">
        {!reachedBottom ? (
          <div className="mb-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-[11px] font-black leading-4 text-emerald-800">
            Desplázate hasta el final para habilitar la aceptación.
          </div>
        ) : null}

        <label
          className={[
            "flex items-start gap-3 rounded-2xl border p-3",
            reachedBottom
              ? "border-slate-200 bg-white"
              : "border-slate-200 bg-slate-50 opacity-60",
          ].join(" ")}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={!reachedBottom}
            onChange={(e) =>
              setChecked(e.target.checked)
            }
            className="mt-1 h-4 w-4 accent-emerald-600"
          />

          <span className="text-[11.5px] font-semibold leading-5 text-slate-700">
            Declaro que he leído, comprendido y acepto el Acuerdo de Independencia para Conductores KroniX.
          </span>
        </label>

        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700"
          >
            Cerrar
          </button>

          <button
            type="button"
            disabled={!canAccept}
            onClick={handleAccept}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black text-white ${
              canAccept
                ? "bg-emerald-600"
                : "bg-slate-300"
            }`}
          >
            {saving ? "Guardando..." : "Aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
}