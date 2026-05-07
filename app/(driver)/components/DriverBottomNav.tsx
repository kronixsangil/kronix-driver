// app/(driver)/components/DriverBottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * BottomNav (clonado del Buyer)
 * Tabs: Inicio / Historial / Ganancias / Perfil
 * Sin badge de carrito (no aplica).
 */

function IconHome({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {active && (
        <path
          d="M10 21v-6h4v6"
          stroke="currentColor"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

function IconHistory() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEarnings() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2v20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 7.5c0-1.9-2-3.5-5-3.5s-5 1.1-5 3 2 3 5 3 5 1.1 5 3-2 3.5-5 3.5-5-1.1-5-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DriverBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const itemClass = (active: boolean) =>
    [
      "flex flex-col items-center justify-center gap-1 text-[11px]",
      "min-w-[64px] py-1",
      active
        ? "text-green-600 font-extrabold"
        : "text-gray-500 font-semibold",
    ].join(" ");

  return (
    // ✅ CAMBIO MÍNIMO: antes era "fixed bottom-0 left-1/2 ..."
    // Ahora queda DENTRO del phone frame (DriverShell tiene relative)
    <nav className="absolute bottom-0 left-0 right-0 z-[999] w-full border-t border-gray-200 bg-white/95 backdrop-blur shadow-[0_-8px_24px_rgba(15,23,42,0.10)]">
      <div className="flex items-center justify-around px-2 py-2">
        <Link className={itemClass(isActive("/"))} href="/">
          <IconHome active={isActive("/")} />
          <span>Inicio</span>
        </Link>

        <Link
          className={itemClass(isActive("/history"))}
          href="/history"
        >
          <IconHistory />
          <span>Historial</span>
        </Link>

        <Link
          className={itemClass(isActive("/earnings"))}
          href="/earnings"
        >
          <IconEarnings />
          <span>Ganancias</span>
        </Link>

        <Link
          className={itemClass(isActive("/profile"))}
          href="/profile"
        >
          <IconProfile />
          <span>Perfil</span>
        </Link>
      </div>
    </nav>
  );
}
