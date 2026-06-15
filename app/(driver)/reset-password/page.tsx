// app/(driver)/reset-password/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/apiFetch";

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function isValidKronixPassword(value: string) {
  const clean = String(value ?? "").trim();
  return clean.length >= 8 && /[a-zA-Z]/.test(clean) && /\d/.test(clean);
}

function passwordHint(value: string) {
  const clean = String(value ?? "").trim();
  if (!clean) return "Debe tener mínimo 8 caracteres y combinar letras y números.";
  if (clean.length < 8) return "Faltan caracteres: mínimo 8.";
  if (!/[a-zA-Z]/.test(clean)) return "Agrega al menos una letra.";
  if (!/\d/.test(clean)) return "Agrega al menos un número.";
  return "Contraseña válida.";
}

export default function DriverForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const passwordOk = isValidKronixPassword(newPassword);

  const canRequest = emailOrPhone.trim().length >= 3 && !loading;
  const canReset = useMemo(() => {
    return (
      emailOrPhone.trim().length >= 3 &&
      code.trim().length >= 4 &&
      passwordOk &&
      newPassword === confirmPassword &&
      !loading
    );
  }, [emailOrPhone, code, passwordOk, newPassword, confirmPassword, loading]);

  const requestCode = async () => {
    if (!canRequest) return;

    setError(null);
    setOkMsg(null);
    setDevCode(null);
    setLoading(true);

    try {
      const res = await apiFetch<{ ok: boolean; devCode?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim() }),
        cache: "no-store",
      });

      setOkMsg(
        "Solicitud recibida. Si la cuenta existe, recibirás las instrucciones de recuperación por el canal autorizado."
      );
      if (res?.devCode) setDevCode(String(res.devCode));
      setStep(2);
    } catch (e: any) {
      setError(e?.message || "No pudimos solicitar la recuperación. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!canReset) return;

    setError(null);
    setOkMsg(null);
    setLoading(true);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          code: code.trim(),
          newPassword: newPassword.trim(),
        }),
        cache: "no-store",
      });

      setOkMsg("Contraseña actualizada ✅ Ahora puedes iniciar sesión.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
    } catch (e: any) {
      const raw = String(e?.message ?? "");
      if (raw.toLowerCase().includes("contraseña") || raw.toLowerCase().includes("password")) {
        setError("La nueva contraseña debe tener mínimo 8 caracteres y combinar letras y números. No necesita símbolos.");
      } else {
        setError(e?.message || "No se pudo cambiar la contraseña.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="relative overflow-hidden rounded-3xl shadow-xl border border-gray-200 bg-white">
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 px-6 pt-8 pb-10 text-white">
          <div className="text-2xl font-extrabold">Recuperar contraseña</div>
          <div className="mt-2 text-sm text-white/90">
            Te ayudamos a recuperar tu acceso de conductor.
          </div>
        </div>

        <div className="px-6 pb-8 -mt-6">
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            {error ? (
              <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            {okMsg ? (
              <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-700">
                {okMsg}
              </div>
            ) : null}

            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Paso {step} de 2
              </div>
              <div className="mt-1 text-sm font-extrabold text-gray-900">
                {step === 1 ? "Solicitar recuperación" : "Confirmar código y nueva contraseña"}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Email o teléfono
              </div>

              <input
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Ingresa tu email o número"
                autoComplete="username"
                className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && step === 1 && canRequest) requestCode();
                }}
              />
            </div>

            {step === 2 ? (
              <>
                <div className="mt-5">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Código
                  </div>

                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej: 123456"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                  />
                </div>

                {devCode ? (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                    <div className="font-extrabold">Código DEV</div>
                    <div className="mt-1">
                      Usa este código en ambiente local: <span className="font-extrabold">{devCode}</span>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Nueva contraseña
                  </div>

                  <div className="relative mt-2">
                    <input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type={showNew ? "text" : "password"}
                      placeholder="8 caracteres, letras y números"
                      autoComplete="new-password"
                      className={cx(
                        "w-full rounded-2xl border px-4 py-3 pr-12 text-sm bg-gray-50 focus:bg-white outline-none transition",
                        newPassword.length > 0 && !passwordOk
                          ? "border-amber-300 focus:border-amber-400"
                          : "border-gray-200 focus:border-blue-500"
                      )}
                    />

                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-500 hover:text-gray-800"
                    >
                      {showNew ? "🙈" : "👁️"}
                    </button>
                  </div>

                  <div className={cx("mt-2 text-[11px] font-semibold", passwordOk ? "text-emerald-600" : "text-gray-500")}>
                    {passwordHint(newPassword)}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Confirmar contraseña
                  </div>

                  <div className="relative mt-2">
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repite tu contraseña"
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 pr-12 text-sm bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canReset) resetPassword();
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-500 hover:text-gray-800"
                    >
                      {showConfirm ? "🙈" : "👁️"}
                    </button>
                  </div>

                  {confirmPassword && newPassword !== confirmPassword ? (
                    <div className="mt-2 text-[11px] font-semibold text-red-600">
                      La confirmación no coincide.
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <button
                disabled={!canRequest}
                onClick={requestCode}
                className={cx(
                  "mt-6 w-full rounded-2xl py-3 text-sm font-extrabold text-white transition-all duration-200",
                  "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? "Enviando…" : "SOLICITAR RECUPERACIÓN"}
              </button>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Volver
                </button>

                <button
                  disabled={!canReset}
                  onClick={resetPassword}
                  className={cx(
                    "w-full rounded-2xl py-3 text-sm font-extrabold text-white transition-all duration-200",
                    "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {loading ? "Guardando…" : "CAMBIAR CONTRASEÑA"}
                </button>
              </div>
            )}

            <div className="mt-5 text-center">
              <Link
                href="/login"
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                ¿Ya la recordaste? Volver a iniciar sesión
              </Link>
            </div>

            <div className="mt-6 text-center text-[11px] text-gray-500">
              Si tienes problemas, contáctanos por Soporte.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
