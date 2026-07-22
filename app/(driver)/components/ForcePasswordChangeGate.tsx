//app\(driver)\components\ForcePasswordChangeGate.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMe } from "../../../lib/driverAuth";

function isPublicRoute(pathname: string) {
  return (
    pathname === "/login" ||
pathname === "/register" ||
pathname === "/forgot-password" ||
pathname === "/reset-password" ||
pathname.startsWith("/login?") ||
pathname.startsWith("/register?") ||
pathname.startsWith("/forgot-password?") ||
pathname.startsWith("/reset-password?")
  );
}

export default function ForcePasswordChangeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (isPublicRoute(pathname)) {
        if (alive) {
          setMustChangePassword(false);
          setChecking(false);
        }
        return;
      }

      setChecking(true);

      const me = await getMe();
      if (!alive) return;

      const force = Boolean(me?.user?.mustChangePassword);
      setMustChangePassword(force);
      setChecking(false);

      if (force && pathname !== "/profile/security") {
        router.replace("/profile/security");
      }
    }

    load();

    const onChanged = () => load();
    window.addEventListener("auth:changed", onChanged);
    window.addEventListener("focus", onChanged);

    return () => {
      alive = false;
      window.removeEventListener("auth:changed", onChanged);
      window.removeEventListener("focus", onChanged);
    };
  }, [pathname, router]);

  if (!isPublicRoute(pathname) && checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-lg font-black text-slate-950">Validando seguridad…</div>
          <div className="mt-2 text-sm font-semibold text-slate-500">Estamos revisando tu sesión.</div>
        </div>
      </div>
    );
  }

  if (!isPublicRoute(pathname) && mustChangePassword && pathname !== "/profile/security") {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-3xl ring-1 ring-amber-200">
            🔐
          </div>
          <h1 className="mt-4 text-xl font-black text-slate-950">Cambio de contraseña requerido</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Tu contraseña fue restablecida por KroniX. Debes cambiarla antes de continuar.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/profile/security")}
            className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
          >
            Cambiar contraseña ahora
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}