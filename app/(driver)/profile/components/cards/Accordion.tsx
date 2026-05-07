//app/(driver)/profile/components/cards/Accordion.tsx
"use client";

import type React from "react";

export default function Accordion({
  title,
  subtitle,
  badge,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full rounded-2xl p-4 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-gray-900">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-gray-600">{subtitle}</div> : null}
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            {badge ? badge : null}
            <span className="text-[11px] font-semibold text-gray-500">{isOpen ? "Ocultar" : "Ver"}</span>
          </div>
        </div>
      </button>

      <div
        className={[
          "grid transition-all duration-200 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}