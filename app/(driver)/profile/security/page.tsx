//app\(driver)\profile\security\page.tsx
"use client";

import { apiFetch } from "../../../../lib/apiFetch";
import { useEffect, useMemo, useState } from "react";
import { logoutDriver } from "../../../../lib/driverAuthActions";
import { getMe } from "../../../../lib/driverAuth";
import { useDriverCity } from "../../components/DriverCityContext";

type SaveState = "idle" | "saving" | "ok" | "error";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function hasMinLen(p: string) {
  return (p || "").trim().length >= 8;
}

function hasLetter(p: string) {
  return /[a-zA-Z]/.test(String(p || ""));
}

function hasNumber(p: string) {
  return /\d/.test(String(p || ""));
}

function isValidKronixPassword(p: string) {
  return hasMinLen(p) && hasLetter(p) && hasNumber(p);
}

export default function DriverSecurityPage() {
  const { cityLabel, cityName, loading: cityLoading } = useDriverCity();

  const [open, setOpen] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [state, setState] = useState<SaveState>("idle");
  const [msg, setMsg] = useState("");

  const reqMinLen = useMemo(() => hasMinLen(newPassword), [newPassword]);
  const reqLetter = useMemo(() => hasLetter(newPassword), [newPassword]);
  const reqNumber = useMemo(() => hasNumber(newPassword), [newPassword]);
  const reqMatch = useMemo(
    () => (confirmPassword || "").trim().length > 0 && newPassword === confirmPassword,
    [newPassword, confirmPassword]
  );

  const canSubmit = useMemo(() => {
    return currentPassword.trim().length > 0 && isValidKronixPassword(newPassword) && reqMatch && state !== "saving";
  }, [currentPassword, newPassword, reqMatch, state]);

  const cityText = cityLoading ? "Cargando ciudad..." : cityLabel || cityName || "Ciudad no asignada";

  useEffect(() => {
    let alive = true;

    getMe().then((me) => {
      if (!alive) return;
      const force = Boolean(me?.user?.mustChangePassword);
      setMustChangePassword(force);
      if (force) setOpen(true);
    });

    return () => {
      alive = false;
    };
  }, []);

  async function tryChangePassword(payload: { currentPassword: string; newPassword: string }) {
    const candidates: Array<{ url: string; method: "POST" | "PATCH" }> = [
      { url: "/auth/change-password", method: "POST" },
      { url: "/auth/password/change", method: "POST" },
      { url: "/auth/me/password", method: "PATCH" },
    ];

    let lastErr: any = null;

    for (const c of candidates) {
      try {
        await apiFetch(c.url, {
          method: c.method,
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: payload.currentPassword,
            newPassword: payload.newPassword,
          }),
        });
        return { ok: true as const, used: c.url };
      } catch (e: any) {
        lastErr = e;
        if (e?.status === 404) continue;
        throw e;
      }
    }

    const err = lastErr ?? new Error("No se encontró endpoint para cambiar contraseña.");
    (err as any).status = 404;
    throw err;
  }

  async function onSubmit() {
    if (!canSubmit) return;

    setState("saving");
    setMsg("");

    try {
      const cur = currentPassword.trim();
      const next = newPassword.trim();

      await tryChangePassword({ currentPassword: cur, newPassword: next });

      setState("ok");
      setMsg("Contraseña actualizada correctamente.");
      setMustChangePassword(false);
      window.dispatchEvent(new Event("auth:changed"));

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOpen(false);
    } catch (e: any) {
      setState("error");

      if (e?.status === 404) {
        setMsg(
          "Aún falta el endpoint para cambiar contraseña en el backend. Recomendado: POST /auth/change-password (currentPassword, newPassword) con sesión activa."
        );
      } else if (e?.status === 401) {
        setMsg("Sesión no válida. Inicia sesión de nuevo e inténtalo.");
      } else if (e?.status === 400) {
        setMsg("Datos inválidos. Verifica la contraseña actual y que la nueva tenga mínimo 8 caracteres, letras y números.");
      } else {
        setMsg(e?.message || "No se pudo actualizar la contraseña.");
      }
    } finally {
      setState((prev) => (prev === "saving" ? "idle" : prev));
    }
  }

  async function handleLogout() {
    try {
      await logoutDriver();
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-5">
        <div className="px-2">
          <h1 className="text-lg font-extrabold text-gray-900">Seguridad</h1>
          <p className="mt-1 text-sm text-gray-600">Protección de tu cuenta</p>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {cityText}
          </div>

          {mustChangePassword ? (
            <div className="mt-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
              🔐 Tu contraseña fue restablecida por KroniX. Debes cambiarla antes de continuar usando la app.
            </div>
          ) : null}
        </div>

        <div className="mx-2 rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.10)]">
          <div className="text-sm font-extrabold text-gray-900">Sesión actual</div>
          <div className="mt-1 text-xs text-gray-600">Activa en este dispositivo.</div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] active:scale-[0.99]"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="mx-2 rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.10)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-gray-900">Cambiar contraseña</div>
              <div className="mt-1 text-xs text-gray-600">
                Recomendamos actualizar tu contraseña periódicamente para mayor seguridad.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMsg("");
                setState("idle");
                setOpen((v) => !v);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[11px] font-extrabold",
                open ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-gray-50 text-gray-700 border-gray-200"
              )}
            >
              {open ? "Cerrar" : "Editar"}
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-slate-50 p-3">
            <div className="text-xs font-extrabold text-gray-900">Requisitos</div>

            <div className="mt-2 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-extrabold",
                    reqMinLen ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-white text-gray-700 border-gray-200"
                  )}
                >
                  {reqMinLen ? "✓" : "•"}
                </span>
                <span className={cn(reqMinLen ? "text-emerald-800" : "text-gray-700")}>Mínimo 8 caracteres</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-extrabold",
                    reqLetter ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-white text-gray-700 border-gray-200"
                  )}
                >
                  {reqLetter ? "✓" : "•"}
                </span>
                <span className={cn(reqLetter ? "text-emerald-800" : "text-gray-700")}>Contiene al menos una letra</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-extrabold",
                    reqNumber ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-white text-gray-700 border-gray-200"
                  )}
                >
                  {reqNumber ? "✓" : "•"}
                </span>
                <span className={cn(reqNumber ? "text-emerald-800" : "text-gray-700")}>Contiene al menos un número</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-extrabold",
                    reqMatch ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-white text-gray-700 border-gray-200"
                  )}
                >
                  {reqMatch ? "✓" : "•"}
                </span>
                <span className={cn(reqMatch ? "text-emerald-800" : "text-gray-700")}>Confirmación coincide</span>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "mt-4 overflow-hidden transition-all duration-300",
              open ? "max-h-[720px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <div className="text-xs font-extrabold text-gray-900">Contraseña actual</div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    type={showCurrent ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-400"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-extrabold text-gray-700"
                  >
                    {showCurrent ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <div className="text-xs font-extrabold text-gray-900">Nueva contraseña</div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type={showNew ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-400"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-extrabold text-gray-700"
                  >
                    {showNew ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <div className="text-xs font-extrabold text-gray-900">Confirmar nueva contraseña</div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-400"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-extrabold text-gray-700"
                  >
                    {showConfirm ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className={cn(
                  "w-full rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] active:scale-[0.99] transition-all",
                  canSubmit ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-300"
                )}
              >
                {state === "saving" ? "Actualizando…" : "Actualizar contraseña"}
              </button>

              {msg ? (
                <div
                  className={cn(
                    "rounded-2xl border p-3 text-xs font-semibold",
                    state === "ok"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  )}
                >
                  {msg}
                </div>
              ) : null}

              <div className="text-[11px] text-gray-500">
                Si olvidaste tu contraseña, contáctanos por <span className="font-semibold">Soporte</span>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}