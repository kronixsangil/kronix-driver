// app/(driver)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/apiFetch";

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function readApiMessage(e: any) {
  const raw = String(e?.message ?? e?.toString?.() ?? "").trim();

  try {
    const parsed = JSON.parse(raw);
    const msg = String(parsed?.message ?? parsed?.error ?? "").trim();
    if (msg) return msg;
  } catch {}

  return raw;
}

export default function DriverForgotPasswordPage() {
  const router = useRouter();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [submittedIdentifier, setSubmittedIdentifier] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanIdentifier = emailOrPhone.trim();
  const canSubmit = cleanIdentifier.length >= 3 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;

    setError(null);
    setLoading(true);

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ emailOrPhone: cleanIdentifier }),
        cache: "no-store",
      });

      setSubmittedIdentifier(cleanIdentifier);
      setStep(2);
    } catch (e: any) {
      const msg = readApiMessage(e).toLowerCase();

      if (msg.includes("not found") || msg.includes("no existe") || msg.includes("no encontramos")) {
        setError("No encontramos esa cuenta. Verifica el email o teléfono registrado.");
      } else {
        setError("No pudimos registrar la solicitud. Intenta nuevamente o contacta soporte.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-5 pb-10">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.12)]">
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#2168ff_0%,#0897d8_48%,#06c460_100%)] px-6 pb-12 pt-9 text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 left-6 h-40 w-40 rounded-full bg-emerald-300/25 blur-2xl" />

          <div className="relative z-10">
            <h1 className="text-[26px] font-black leading-tight tracking-tight">
              Recuperar contraseña
            </h1>
            <p className="mt-2 text-[14px] font-semibold leading-snug text-white/92">
              Te ayudamos a recuperar tu acceso de conductor.
            </p>
          </div>
        </section>

        <section className="relative z-10 -mt-7 px-6 pb-8">
          <div className="rounded-[24px] bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.14)] ring-1 ring-slate-100">
            {step === 1 ? (
              <>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Paso 1 de 2
                  </div>
                  <div className="mt-1 text-[15px] font-black text-slate-950">
                    Solicitar recuperación
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-[12px] font-black uppercase tracking-[0.08em] text-slate-600">
                    Email o teléfono
                  </label>

                  <input
                    value={emailOrPhone}
                    onChange={(e) => {
                      setEmailOrPhone(e.target.value);
                      setError(null);
                    }}
                    placeholder="Ingresa tu email o número"
                    autoComplete="username"
                    className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmit) handleSubmit();
                    }}
                  />
                </div>

                {error ? (
                  <div className="mt-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-bold leading-5 text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  className={cx(
                    "mt-6 h-[48px] w-full rounded-[16px] text-[14px] font-black uppercase tracking-[0.02em] text-white transition-all duration-200",
                    "bg-emerald-600 shadow-[0_10px_22px_rgba(16,185,129,0.20)] hover:bg-emerald-700 active:scale-[0.98]",
                    "disabled:cursor-not-allowed disabled:bg-emerald-300 disabled:shadow-none"
                  )}
                >
                  {loading ? "Solicitando…" : "Solicitar recuperación"}
                </button>

                <div className="mt-5 text-center text-[13px] font-semibold text-slate-600">
                  ¿Ya la recordaste?{" "}
                  <Link href="/login" className="font-black text-blue-700 hover:underline">
                    Volver a iniciar sesión
                  </Link>
                </div>

                <div className="mt-6 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-center text-[11px] font-semibold leading-5 text-slate-500">
                  Tu solicitud será atendida por soporte KroniX. Recibirás una contraseña temporal por WhatsApp Business.
                </div>
              </>
            ) : (
              <>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Paso 2 de 2
                  </div>
                  <div className="mt-1 text-[15px] font-black text-slate-950">
                    Revisa tu información
                  </div>
                </div>

                <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
                  <div className="mx-auto grid h-[64px] w-[64px] place-items-center rounded-full border-2 border-emerald-500 bg-emerald-100 text-[30px] shadow-sm">
                    ✉️
                  </div>

                  <div className="mt-5 text-[18px] font-black text-emerald-700">
                    Solicitud enviada
                  </div>

                  <div className="mx-auto mt-3 max-w-[280px] text-[13px] font-semibold leading-6 text-slate-700">
                    Si tu cuenta existe, el equipo KroniX revisará la solicitud y te contactará por WhatsApp Business.
                  </div>

                  <div className="mt-4 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-[15px] font-black text-slate-950 shadow-sm">
                    {submittedIdentifier || cleanIdentifier}
                  </div>

                  <div className="mx-auto mt-4 max-w-[285px] text-[12px] font-semibold leading-5 text-slate-700">
                    El operador podrá restablecer tu contraseña temporalmente. Por seguridad, deberás cambiarla al iniciar sesión.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.replace("/login")}
                  className="mt-5 flex h-[50px] w-full items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white text-[14px] font-black uppercase tracking-[0.02em] text-emerald-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
                >
                  <span aria-hidden="true">↩</span>
                  Volver a iniciar sesión
                </button>

                <div className="mt-6 text-center text-[11px] font-semibold leading-5 text-slate-500">
                  Si tienes problemas, contáctanos por Soporte.
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
