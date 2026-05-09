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

  const isPublic = useMemo(() => {
    const p = String(pathname ?? "");
    return p === "/login" || p === "/forgot-password" || p === "/reset-password";
  }, [pathname]);

  const [checking, setChecking] = useState(true);
  const [notDriver, setNotDriver] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
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
    <div className="fixed inset-0 overflow-hidden bg-gray-100 driver-app-shell">
      <div className="mx-auto h-[100dvh] w-full max-w-md overflow-hidden bg-white shadow-sm md:my-4 md:h-[calc(100dvh-2rem)] md:rounded-[28px] md:border md:border-gray-200">
        <div className="relative h-full w-full overflow-hidden bg-gray-50">
          <header className="absolute left-0 right-0 top-0 z-[1000] bg-white">
            <DriverTopBar />
          </header>

          <main
            id="driver-scroll-container"
            className={[
              "absolute left-0 right-0 overflow-y-auto overscroll-contain no-scrollbar",
              "touch-pan-y scroll-smooth bg-gray-50",
              isPublic
                ? "top-[76px] bottom-0 px-0 pt-0 pb-0"
                : "top-[76px] bottom-[76px] px-4 pt-4 pb-6",
            ].join(" ")}
          >
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

          {!isPublic ? <DriverBottomNav /> : null}
        </div>
      </div>
    </div>
  );
}