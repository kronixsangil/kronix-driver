//app\(driver)\profile\components\DriverTermsModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  acceptDriverTermsBackend,
  getCurrentDriverTermsDocument,
  type DriverLegalDocument,
} from "../../lib/driverTermsLegal";

type Props = {
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
};

export default function DriverTermsModal({ open, onClose, onAccepted }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [reachedBottom, setReachedBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [legalDoc, setLegalDoc] = useState<DriverLegalDocument | null>(null);

  const paragraphs = useMemo(() => {
    return String(legalDoc?.content ?? "")
      .split("\n")
      .filter((line) => line.trim().length > 0);
  }, [legalDoc?.content]);

  useEffect(() => {
    if (!open) return;

    setReachedBottom(false);
    setChecked(false);
    setSaving(false);
    setLoadingDoc(true);

    getCurrentDriverTermsDocument()
      .then((doc) => setLegalDoc(doc))
      .catch(() => setLegalDoc(null))
      .finally(() => setLoadingDoc(false));
  }, [open]);

  if (!open) return null;

  const title = legalDoc?.title || "Términos y Condiciones para Conductores KroniX";
  const version = legalDoc?.version || "Versión vigente";
  const lastUpdated = legalDoc?.updatedAt
    ? new Date(legalDoc.updatedAt).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })
    : "Legal Center";

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setReachedBottom(true);
    }
  }

  async function handleAccept() {
    if (!reachedBottom || !checked || saving || !legalDoc?.version) return;

    setSaving(true);

    try {
      await acceptDriverTermsBackend(legalDoc.version);
      alert("Gracias. Los Términos y Condiciones fueron aceptados correctamente.");
      onAccepted();
      onClose();
    } catch {
      alert("No fue posible registrar la aceptación legal.");
    } finally {
      setSaving(false);
    }
  }

  const canAccept = reachedBottom && checked && !saving && !!legalDoc?.version;

  return (
    <div className="mx-0 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-blue-100 bg-blue-50 px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-2xl">
            ⚖️
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-black leading-5 text-slate-950">
              {title}
            </h2>

            <div className="mt-3 flex flex-col gap-1.5">
              <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-700 ring-1 ring-blue-100">
                📄 Versión: {version}
              </span>

              <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-700 ring-1 ring-blue-100">
                📅 Actualizado: {lastUpdated}
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
        {loadingDoc ? (
          <p className="mb-3 text-[12.5px] font-semibold leading-5 text-slate-600">
            Cargando documento legal vigente desde Legal Center...
          </p>
        ) : paragraphs.length === 0 ? (
          <p className="mb-3 text-[12.5px] font-semibold leading-5 text-amber-700">
            No se pudo cargar el documento legal vigente. Intenta nuevamente.
          </p>
        ) : (
          paragraphs.map((p, index) => {
            const clean = p.replace(/^#+\s?/, "").trim();

            const isTitle =
              clean.startsWith("BLOQUE") ||
              /^[0-9]+[\.\)]\s/.test(clean) ||
              (clean.length < 90 && clean.toUpperCase() === clean);

            const isBullet = clean.startsWith("•") || clean.startsWith("-");

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
          })
        )}

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
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-4 w-4 accent-emerald-600"
          />

          <span className="text-[11.5px] font-semibold leading-5 text-slate-700">
            Declaro que he leído, comprendido y acepto los Términos y
            Condiciones para Conductores KroniX.
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
              canAccept ? "bg-emerald-600" : "bg-slate-300"
            }`}
          >
            {saving ? "Guardando..." : "Aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
}