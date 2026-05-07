//app/(driver)/profile/components/cards/LevelCard.tsx
"use client";

import Accordion from "./Accordion";

export default function LevelCard({
  isOpen,
  onToggle,
  levelKey,
  progressPct,
  remaining,
  hasNext,
}: {
  isOpen: boolean;
  onToggle: () => void;
  levelKey: string;
  progressPct: number;
  remaining: number;
  hasNext: boolean;
}) {
  return (
    <Accordion
      title="Nivel del conductor"
      subtitle={`Nivel actual: ${levelKey}`}
      badge={
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-200">
          {levelKey}
        </span>
      }
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Progreso al siguiente nivel</span>
          <span className="font-semibold">{progressPct}%</span>
        </div>

        <div className="mt-2 h-3 w-full rounded-full bg-gray-100">
          <div
            className="h-3 rounded-full bg-emerald-600 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {hasNext ? (
          <p className="mt-2 text-xs text-gray-500">
            Te faltan <span className="font-semibold">{remaining}</span> entregas para subir de nivel.
          </p>
        ) : (
          <p className="mt-2 text-xs text-gray-500">🎉 Has alcanzado el nivel máximo.</p>
        )}
      </div>
    </Accordion>
  );
}