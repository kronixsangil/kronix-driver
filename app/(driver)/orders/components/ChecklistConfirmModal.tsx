//app/(driver)/orders/components/ChecklistConfirmModal.tsx
"use client";

import * as React from "react";
import Image from "next/image";

type Check = {
  id: string;
  label: string;
  required?: boolean;
};

type Props = {
  open: boolean;
  title: string;
  description?: string;
  checks: Check[];
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ChecklistConfirmModal({
  open,
  title,
  description,
  checks,
  confirmText = "Sí, continuar",
  cancelText = "Volver",
  onCancel,
  onConfirm,
}: Props) {
  const [state, setState] = React.useState<Record<string, boolean>>({});
  const prevOpenRef = React.useRef(false);

  const normalizedChecks = React.useMemo(() => {
    const base = Array.isArray(checks) ? checks : [];

    const hasReadObservationsCheck = base.some((c) => {
      const txt = String(c?.label ?? "").toLowerCase();
      return (
        txt.includes("indicaciones") ||
        txt.includes("observaciones") ||
        txt.includes("comentarios") ||
        txt.includes("leí")
      );
    });

    if (!hasReadObservationsCheck) {
      return [
        ...base,
        {
          id: "read_customer_observations",
          label: "Leí todas las observaciones e indicaciones del cliente.",
          required: true,
        },
      ];
    }

    return base;
  }, [checks]);

  React.useEffect(() => {
    const wasOpen = prevOpenRef.current;

    if (!wasOpen && open) {
      const next: Record<string, boolean> = {};
      for (const c of normalizedChecks) next[c.id] = false;
      setState(next);
    }

    prevOpenRef.current = open;
  }, [open, normalizedChecks]);

  if (!open) return null;

  const allRequiredChecked = normalizedChecks.every((c) =>
    (c.required ?? true) ? !!state[c.id] : true
  );

  const checkedCount = normalizedChecks.filter((c) => !!state[c.id]).length;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
      <button
        aria-label="Cerrar"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-[410px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.30)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-5 pt-5 pb-4">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-200/35 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-cyan-200/30 blur-2xl" />

          <div className="relative z-10 text-center">
            <div className="mx-auto relative h-[54px] w-[170px]">
  <Image
    src="/branding/kronix/header-logo.png"
    alt="KroniX"
    fill
    className="object-contain"
    sizes="170px"
    priority
  />
</div>

<h3 className="mt-2 text-[19px] font-black leading-tight text-slate-900">
  {title}
</h3>

            {description ? (
              <p className="mx-auto mt-2 max-w-[300px] text-[13px] font-medium leading-5 text-slate-600">
                {description}
              </p>
            ) : null}

            <div className="mx-auto mt-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-600 shadow-sm ring-1 ring-slate-200">
              {checkedCount}/{normalizedChecks.length} verificado(s)
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 pt-4">
          <div className="space-y-2.5">
            {normalizedChecks.map((c) => {
              const checked = !!state[c.id];

              return (
                <label
                  key={c.id}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-[20px] border px-3 py-3 transition",
                    checked
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:bg-white",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-emerald-600"
                    checked={checked}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, [c.id]: e.target.checked }))
                    }
                  />

                  <span
                    className={[
                      "text-[14px] font-semibold leading-5",
                      checked ? "text-emerald-900" : "text-slate-800",
                    ].join(" ")}
                  >
                    {c.label}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-[20px] border border-slate-200 bg-white px-3 py-3 text-[14px] font-black text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={onCancel}
            >
              {cancelText}
            </button>

            <button
              type="button"
              className="rounded-[20px] bg-emerald-600 px-3 py-3 text-[14px] font-black text-white shadow-[0_10px_20px_rgba(5,150,105,0.22)] hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 disabled:shadow-none"
              disabled={!allRequiredChecked}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}