// app/(driver)/reset-password/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/apiFetch";

type ApiError = { status: number; message: string };

export default function DriverResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => token.trim().length >= 4 && newPassword.trim().length >= 4, [token, newPassword]);

  async function onSubmit() {
    if (!canSubmit || loading) return;

    setLoading(true);
    setMsg(null);
    setErr(null);

    try {
      // ✅ MISMO endpoint que ya funciona en Buyer
      await apiFetch("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token: token.trim(), newPassword: newPassword.trim() }),
        cache: "no-store",
      });

      setMsg("Contraseña actualizada ✅ Ahora puedes iniciar sesión.");
      setTimeout(() => router.push("/login"), 800);
    } catch (e: any) {
      const ex = e as ApiError;
      setErr(ex?.message || "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50 p-4">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold">Restablecer contraseña (Driver)</h1>
        <p className="mt-1 text-sm text-gray-600">
          Pega el <b>código/token</b> que recibiste y escribe tu nueva contraseña.
        </p>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-gray-600">CÓDIGO / TOKEN</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Ej: 123456 o token largo"
            className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-gray-300"
          />
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold text-gray-600">NUEVA CONTRASEÑA</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 4 caracteres"
            className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-gray-300"
          />
        </div>

        {msg ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {msg}
          </div>
        ) : null}

        {err ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </div>
        ) : null}

        <button
          onClick={onSubmit}
          disabled={!canSubmit || loading}
          className="mt-5 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Guardando..." : "CAMBIAR CONTRASEÑA"}
        </button>

        <button
          onClick={() => router.push("/forgot-password")}
          className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700"
        >
          Reenviar / Volver
        </button>
      </div>
    </div>
  );
}
