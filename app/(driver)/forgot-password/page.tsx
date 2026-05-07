// app/(driver)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/apiFetch";

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

export default function DriverForgotPasswordPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const canSubmit = emailOrPhone.trim().length >= 3 && !loading;

  const handleSubmit = async () => {
    setError(null);
    setOkMsg(null);
    setLoading(true);

    try {
      await apiFetch("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim() }),
        cache: "no-store",
      });

      setOkMsg("Listo. Te enviamos un código/enlace para restablecer la contraseña.");
      setLoading(false);
    } catch (e: any) {
      const msg = String(e?.message ?? e?.toString?.() ?? "");
      if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no existe")) {
        setError("No encontramos esa cuenta. Verifica el email o teléfono.");
      } else {
        setError("No pudimos enviar el código. Intenta nuevamente.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="relative overflow-hidden rounded-3xl shadow-xl border border-gray-200 bg-white">
        {/* ✅ MISMO HEADER QUE LOGIN */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 px-6 pt-8 pb-10 text-white">
          <div className="text-2xl font-extrabold">Recuperar contraseña</div>
          <div className="mt-2 text-sm text-white/90">
            Te ayudamos a recuperar tu acceso en minutos.
          </div>
        </div>

        {/* ✅ MISMO CONTENEDOR INTERNO QUE LOGIN */}
        <div className="px-6 pb-8 -mt-6">
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <div>
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Email o Teléfono
              </div>

              <input
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Ingresa tu email o número"
                autoComplete="username"
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) handleSubmit();
                }}
              />
            </div>

            {okMsg ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-700">
                {okMsg}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={cx(
                "mt-6 w-full rounded-2xl py-3 text-sm font-extrabold text-white transition-all duration-200",
                "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? "Enviando…" : "ENVIAR CÓDIGO"}
            </button>

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
