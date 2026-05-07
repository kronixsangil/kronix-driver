//app\(driver)\profile\components\ProfileHeader.tsx
"use client";

type Props = {
  cityLabel?: string | null;
  loading?: boolean;
};

export default function ProfileHeader({ cityLabel, loading = false }: Props) {
  return (
    <div>
      <h1 className="text-lg font-extrabold text-gray-900">Perfil</h1>
      <p className="mt-1 text-s text-gray-600">Tu cuenta y configuración</p>

      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200 shadow-sm">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        {loading ? "Cargando ciudad..." : cityLabel || "Ciudad no asignada"}
      </div>
    </div>
  );
}