//app/(driver)/profile/info/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { apiFetch } from "../../../../lib/apiFetch";
import { useDriverCity } from "../../components/DriverCityContext";

function normalizeFullName(u: any) {
  return (
    u?.fullName ||
    u?.name ||
    u?.displayName ||
    [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
    ""
  );
}

export default function DriverInfoPage() {
  const { cityLabel, cityName, loading: cityLoading } = useDriverCity();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [source, setSource] = useState<"drivers/me" | "auth/me" | "none">("none");
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    profileImageUrl: "",
  });

  const canSave = useMemo(() => {
    const fn = String(form.fullName || "").trim();
    const em = String(form.email || "").trim();
    const ph = String(form.phone || "").trim();
    return fn.length >= 2 && (em.length > 0 || ph.length > 0);
  }, [form]);

  const cityText = cityLoading ? "Cargando ciudad..." : cityLabel || cityName || "Ciudad no asignada";

  function handlePhotoFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona una imagen válida.");
      return;
    }
    if (file.size > 750_000) {
      setError("La foto debe pesar máximo 750 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, profileImageUrl: String(reader.result ?? "") }));
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const out = await apiFetch<any>("/drivers/me", { method: "GET", cache: "no-store" });
        if (!mounted) return;

        const u = out?.user ?? out;
        const fullName = normalizeFullName(u);

        setForm({
          fullName: String(fullName || "").trim(),
          email: String(u?.email ?? "").trim(),
          phone: String(u?.phone ?? "").trim(),
          profileImageUrl: String(u?.profileImageUrl ?? "").trim(),
        });

        setSource("drivers/me");
        setLoading(false);
        return;
      } catch (e: any) {
        const status = Number(e?.status ?? 0);
        const msg = String(e?.message ?? "").toLowerCase();

        const isNotFound = status === 404 || msg.includes("not found");
        if (!isNotFound) {
          if (!mounted) return;
          setError(e?.message || "No se pudo cargar tu información desde /drivers/me.");
          setSource("none");
          setLoading(false);
          return;
        }
      }

      try {
        const out = await apiFetch<any>("/auth/me", { method: "GET", cache: "no-store" });
        if (!mounted) return;

        const u = out?.user ?? out;
        const fullName = normalizeFullName(u);

        setForm({
          fullName: String(fullName || "").trim(),
          email: String(u?.email ?? "").trim(),
          phone: String(u?.phone ?? "").trim(),
          profileImageUrl: String(u?.profileImageUrl ?? "").trim(),
        });
        setSource("auth/me");
        setLoading(false);
        return;
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "No se pudo cargar tu información desde el backend.");
        setSource("none");
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError("");

    try {
      await apiFetch("/drivers/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: String(form.fullName || "").trim(),
          name: String(form.fullName || "").trim(),
          email: String(form.email || "").trim() || null,
          phone: String(form.phone || "").trim() || null,
          profileImageUrl: String(form.profileImageUrl || "").trim() || null,
        }),
        cache: "no-store",
      });

      try {
        const out = await apiFetch<any>("/drivers/me", { method: "GET", cache: "no-store" });
        const u = out?.user ?? out;

        const fullName = normalizeFullName(u);
        setForm({
          fullName: String(fullName || "").trim(),
          email: String(u?.email ?? "").trim(),
          phone: String(u?.phone ?? "").trim(),
          profileImageUrl: String(u?.profileImageUrl ?? "").trim(),
        });
        setSource("drivers/me");
      } catch {}

      alert("✅ Guardado correctamente");
    } catch (e: any) {
      const msg = String(e?.message || "").toLowerCase();

      if (e?.status === 404 || msg.includes("not found")) {
        setError(
          "El backend aún no tiene el endpoint PATCH /drivers/me (o no está disponible). Esta pantalla ya está lista, pero falta crear/activar ese endpoint en la API."
        );
      } else if (e?.status === 401) {
        setError("Sesión no válida (401). Vuelve a iniciar sesión y reintenta.");
      } else if (e?.status === 403) {
        setError("No tienes permiso (403). Verifica rol DRIVER y guard de roles.");
      } else {
        setError(e?.message || "No se pudo guardar.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">Tu información</h1>
            <p className="mt-1 text-s text-gray-600">Edita tus datos personales</p>

            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              {cityText}
            </div>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
            Fuente: {source === "drivers/me" ? "/drivers/me" : source === "auth/me" ? "/auth/me" : "—"}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
          {loading ? <div className="text-sm text-gray-600">Cargando desde backend…</div> : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Ciudad operativa</div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">{cityText}</div>
            <div className="mt-1 text-[12px] text-slate-600">
              Esta información viene del esquema multiciudad del conductor.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Foto de perfil</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-900 text-white ring-1 ring-slate-200">
                {form.profileImageUrl ? (
                  <Image src={form.profileImageUrl} alt="Foto de perfil" fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm font-extrabold">Foto</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <label className="inline-flex cursor-pointer rounded-2xl bg-slate-900 px-4 py-3 text-xs font-extrabold text-white">
                  Elegir foto
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoFile(e.target.files?.[0] ?? null)} />
                </label>
                {form.profileImageUrl ? (
                  <button type="button" onClick={() => setForm((p) => ({ ...p, profileImageUrl: "" }))} className="ml-2 rounded-2xl border border-gray-200 px-4 py-3 text-xs font-extrabold text-gray-700">
                    Quitar
                  </button>
                ) : null}
                <div className="mt-2 text-[11px] text-gray-500">Máximo 750 KB.</div>
              </div>
            </div>
          </div>

          <Field
            label="Nombre completo"
            value={form.fullName}
            onChange={(v) => setForm((p) => ({ ...p, fullName: v }))}
            placeholder="Ej: Blass Murillo"
          />
          <Field
            label="Email"
            value={form.email}
            onChange={(v) => setForm((p) => ({ ...p, email: v }))}
            placeholder="Ej: driver1@kronix.com"
          />
          <Field
            label="Teléfono"
            value={form.phone}
            onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
            placeholder="Ej: +57..."
          />

          <button
            type="button"
            onClick={save}
            disabled={!canSave || saving || loading}
            className={[
              "w-full rounded-2xl px-4 py-3 text-sm font-extrabold shadow-sm active:scale-[0.99]",
              !canSave || saving || loading ? "bg-gray-200 text-gray-500" : "bg-emerald-600 text-white",
            ].join(" ")}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>

          <p className="text-[11px] text-gray-500">
            Guardado real: usa <span className="font-semibold">PATCH /drivers/me</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-emerald-200"
      />
    </div>
  );
}