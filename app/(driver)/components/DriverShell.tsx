// app/(driver)/components/DriverShell.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import DriverTopBar from "../components/DriverTopBar";
import DriverBottomNav from "../components/DriverBottomNav";
import { ensureDriverSession } from "../../../lib/driverAuth";

export default function DriverShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Rutas públicas que NO deben ser bloqueadas por el guard
  // (para evitar el “flash” y el redirect inmediato)
  const isPublic = useMemo(() => {
    const p = String(pathname ?? "");
    return p === "/login" || p === "/forgot-password" || p === "/reset-password";
  }, [pathname]);

  const [checking, setChecking] = useState(true);
  const [notDriver, setNotDriver] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      // ✅ En rutas públicas NO bloqueamos ni redirigimos
      if (isPublic) {
        if (alive) {
          setNotDriver(false);
          setChecking(false);
        }
        return;
      }

      const res = await ensureDriverSession();
      if (!alive) return;

      if (!res.ok) {
        if (res.reason === "NOT_DRIVER") {
          setNotDriver(true);
          setChecking(false);
          return;
        }

        // NO_SESSION
        const next = encodeURIComponent(pathname || "/orders");
        router.replace(`/login?next=${next}`);
        return;
      }

      setNotDriver(false);
      setChecking(false);
    })();

    return () => {
      alive = false;
    };
  }, [router, pathname, isPublic]);

  return (
    <div className="h-screen overflow-hidden bg-gray-100 flex justify-center px-4 py-6">
      {/* Phone frame */}
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm relative flex flex-col">
        {/* Header */}
        <DriverTopBar />

        {/* Content */}
        <main
  id="driver-scroll-container"
  className={[
            "bg-gray-50 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            // ✅ CLAVE: en rutas públicas quitamos padding del shell
            // para que Login/Forgot/Reset se vean idénticas (mismo tamaño y posición)
            isPublic
              ? "px-0 pt-0 pb-0 min-h-[calc(100vh-180px)]"
              : "px-4 pt-4 pb-24 min-h-[calc(100vh-180px)]",
          ].join(" ")}
        >
          {/* Gate (solo aplica fuera de rutas públicas) */}
          {!isPublic && checking ? (
            <div className="mt-2 rounded-3xl bg-white p-6 shadow-sm animate-pulse border border-gray-200">
              <div className="h-6 w-44 bg-gray-100 rounded mb-4" />
              <div className="h-12 bg-gray-100 rounded mb-3" />
              <div className="h-12 bg-gray-100 rounded mb-3" />
              <div className="h-12 bg-gray-100 rounded" />
            </div>
          ) : notDriver ? (
            <div className="mt-2 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              Esta cuenta no tiene permisos de conductor (DRIVER). Inicia sesión con una cuenta DRIVER.
            </div>
          ) : (
            children
          )}
        </main>

        {/* ✅ Bottom nav NO se muestra en rutas públicas */}
        {!isPublic ? <DriverBottomNav /> : null}
      </div>
    </div>
  );
}
