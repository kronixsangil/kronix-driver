//app/(driver)/login/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe } from "../../../lib/driverAuth";
import { loginDriver } from "../../../lib/driverAuthActions";
import Link from "next/link";

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function DriverLoginLoading() {
  return (
    <div className="px-4 pt-6 pb-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-gray-100 rounded mb-4" />
        <div className="h-12 bg-gray-100 rounded mb-3" />
        <div className="h-12 bg-gray-100 rounded mb-3" />
        <div className="h-12 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

function DriverLoginPageContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const next = useMemo(() => {
    const n = String(sp.get("next") ?? "").trim();
    if (!n || !n.startsWith("/")) return "/orders";
    return n;
  }, [sp]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const me = await getMe();
      if (!alive) return;

      const role = String(me?.user?.role ?? "").toUpperCase();
      if (me?.user?.sub && role === "DRIVER") {
        router.replace(next);
        return;
      }

      setChecking(false);
    })();

    return () => {
      alive = false;
    };
  }, [router, next]);

  const canSubmit =
    emailOrPhone.trim().length >= 3 && password.trim().length >= 4 && !loading;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      await loginDriver(emailOrPhone, password);

      const me = await getMe();
      const role = String(me?.user?.role ?? "").toUpperCase();

      if (role !== "DRIVER") {
        setError("Esta cuenta no es de Conductor. Usa tu cuenta de conductor para acceder a esta app.");
        setLoading(false);
        return;
      }

      router.replace(next);
    } catch (e: any) {
      const msg = String(e?.message ?? e?.toString?.() ?? "");
      if (
        msg.toLowerCase().includes("inválidos") ||
        msg.toLowerCase().includes("invalid")
      ) {
        setError("Usuario o contraseña incorrectos.");
      } else {
        setError("No pudimos iniciar sesión. Intenta nuevamente.");
      }
      setLoading(false);
    }
  };

  if (checking) {
    return <DriverLoginLoading />;
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="relative overflow-hidden rounded-3xl shadow-xl border border-gray-200 bg-white">
        <div className="relative overflow-hidden bg-gradient-to-tr from-[#0b1f4d] via-[#1d4ed8] to-[#22c55e] px-6 pt-8 pb-10 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_40%)]" />

          <div className="relative z-10 text-2xl font-extrabold">
            Ingreso Conductor
          </div>
          <div className="relative z-10 mt-2 text-sm text-white/90">
            Inicia sesión y gestiona tus entregas en segundos.
          </div>
        </div>

        <div className="relative z-10 px-6 pb-6 -mt-6">
          <div className="rounded-3xl bg-white p-6 shadow-[0_16px_34px_rgba(15,23,42,0.12)]">
            <div>
              <div className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Email o Teléfono
              </div>
              <input
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Ingresa tu email o usuario"
                autoComplete="username"
                className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
              />
            </div>

            <div className="mt-5">
              <div className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Contraseña
              </div>

              <div className="mt-2 relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 pr-12 text-[15px] font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSubmit) handleSubmit();
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 text-lg"
                >
                  {showPass ? "🙈" : "🔍"}
                </button>
              </div>

              <Link
                href="/forgot-password"
                className="mt-2 block text-sm font-semibold text-blue-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

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
              {loading ? "Ingresando…" : "INICIAR SESIÓN"}
            </button>

            <button
  type="button"
  onClick={() => router.push("/register")}
  className="mt-3 flex w-full items-center justify-center rounded-2xl bg-blue-600 py-3 text-sm font-extrabold text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]"
>
  REGISTRARSE
</button>
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-lg p-5">
            <div className="flex items-center gap-3">
              <img
                src="/branding/kronix/kronix-icon.png"
                className="w-6 h-6"
                alt="KroniX"
              />
              <div className="text-[15px] font-extrabold text-slate-900">
                Gana dinero con KroniX
              </div>
            </div>

            <div className="mt-1 text-sm text-slate-600">
              Conduce cuando quieras y aumenta tus ingresos.
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-center shadow-sm">
                <img
                  src="/branding/kronix/flexible.png"
                  className="w-14 h-14 mx-auto"
                  alt="Flexible"
                />
                <div className="mt-2 text-xs font-bold text-slate-700">
                  Flexible
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 text-center shadow-sm">
                <img
                  src="/branding/kronix/rapido.png"
                  className="w-14 h-14 mx-auto"
                  alt="Rápido"
                />
                <div className="mt-2 text-xs font-bold text-slate-700">
                  Rápido
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 text-center shadow-sm">
                <img
                  src="/branding/kronix/ingresos.png"
                  className="w-14 h-14 mx-auto"
                  alt="Ingresos"
                />
                <div className="mt-2 text-xs font-bold text-slate-700">
                  Ingresos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverLoginPage() {
  return (
    <Suspense fallback={<DriverLoginLoading />}>
      <DriverLoginPageContent />
    </Suspense>
  );
}
