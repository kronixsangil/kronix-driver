//app/(driver)/components/DriverTopBar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMe, getDriverMe } from "../../../lib/driverAuth";
import { logoutDriver } from "../../../lib/driverAuthActions";
import { driverReleaseOrder } from "../lib/driverOrderApi";
import { apiFetch } from "../../../lib/apiFetch";
import { useDriverCity } from "./DriverCityContext";

type ActiveState = {
  order: { orderId: string; [k: string]: any };
  step: "ASIGNADO" | "EN_CAMINO" | "EN_RUTA" | "ENTREGADO";
};

type ActiveOrderApiResponse = {
  ok?: boolean;
  activeOrder?: {
    orderId?: string;
    id?: string;
    status?: string | null;
    flowStatus?: string | null;
  } | null;
};

function stepFromApiOrder(input: {
  status?: string | null;
  flowStatus?: string | null;
}): ActiveState["step"] | null {
  const status = String(input?.status ?? "").toUpperCase();
  const flow = String(input?.flowStatus ?? "").toUpperCase();

  if (status === "DELIVERED" || flow === "DELIVERED") return "ENTREGADO";
  if (status === "EN_ROUTE" || flow === "EN_ROUTE" || flow === "EN_RUTA") return "EN_RUTA";
  if (status === "ASSIGNED") return "ASIGNADO";

  return null;
}

async function readActiveFromBackend(): Promise<ActiveState | null> {
  try {
    const out = await apiFetch<ActiveOrderApiResponse>("/drivers/me/active-order", {
      method: "GET",
      cache: "no-store",
    });

    const active = out?.activeOrder;
    const orderId = String(active?.orderId ?? active?.id ?? "").trim();
    if (!orderId) return null;

    const step = stepFromApiOrder({
      status: active?.status,
      flowStatus: active?.flowStatus,
    });

    if (!step) return null;

    return {
      order: { orderId },
      step,
    };
  } catch {
    return null;
  }
}

function getInitials(name: string) {
  const s = String(name ?? "").trim();
  if (!s) return "KR";

  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "K";
  const b =
    parts.length > 1
      ? parts[parts.length - 1]?.[0] ?? ""
      : parts[0]?.[1] ?? "";

  return (a + b).toUpperCase();
}

function encodePathFileName(fileName: string) {
  return fileName
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function buildOfficialDriverPhotoSrc(profileImageUrl?: string | null, driverName?: string | null) {
  const raw = String(profileImageUrl ?? "").trim();

  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/branding/Driver_Pictures/")) return encodePathFileName(raw);

  const name = String(driverName ?? "").trim();
  if (!name) return "";

  return `/branding/Driver_Pictures/${encodeURIComponent(name)}.jpg`;
}

function OfficialDriverAvatar({
  src,
  initials,
  className,
}: {
  src: string;
  initials: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const finalSrc = failed ? "" : String(src || "").trim();

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={className}>
      {finalSrc ? (
        <img
          src={finalSrc}
          alt="Foto oficial del worker"
          className="block h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-green-500" />
          <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full">
            <span className="text-[13px] font-extrabold text-white">{initials}</span>
          </div>
        </>
      )}
    </div>
  );
}


function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function MenuLinkRow({
  href,
  title,
  subtitle,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        "flex items-center gap-4 px-4 py-4 transition",
        active ? "bg-white/70" : "bg-transparent hover:bg-white/60",
      ].join(" ")}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-lg">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-extrabold text-gray-900">{title}</div>
        <div className="truncate text-[13px] text-gray-600">{subtitle}</div>
      </div>

      <div className="shrink-0 text-gray-400">›</div>
    </Link>
  );
}

function MenuActionRow({
  title,
  subtitle,
  icon,
  tone = "neutral",
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string;
  tone?: "neutral" | "danger" | "primary";
  onClick: () => void | Promise<void>;
}) {
  const toneCls =
    tone === "danger"
      ? "text-red-700"
      : tone === "primary"
        ? "text-blue-700"
        : "text-gray-900";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-white/60"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-lg">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className={["text-[15px] font-extrabold", toneCls].join(" ")}>{title}</div>
        <div className="truncate text-[13px] text-gray-600">{subtitle}</div>
      </div>

      <div className="shrink-0 text-gray-400">›</div>
    </button>
  );
}

export default function DriverTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cityName, cityLabel } = useDriverCity();

  const isHome = pathname === "/";
  const isLogin = pathname === "/login";
  const isForgot = pathname === "/forgot-password";
  const isReset = pathname === "/reset-password";
  const isPublic = isLogin || isForgot || isReset;

  const showMenu = isHome && !isLogin;
  const showBack = !isHome;

  const [hasLogo, setHasLogo] = useState(true);

  const [isOnline, setIsOnline] = useState(false);
  const [checkingMe, setCheckingMe] = useState(true);
  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverProfileImageUrl, setDriverProfileImageUrl] = useState("");

  const [active, setActive] = useState<ActiveState | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"BLOCKED" | "ASSIGNED" | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const activeRef = useRef<ActiveState | null>(null);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuWrapRef.current) return;
      if (!menuWrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadSessionState() {
      try {
        setCheckingMe(true);

        const me = await getMe();
        if (!alive) return;

        const role = String(me?.user?.role ?? "").toUpperCase();
        const ok = !!me?.user?.sub && role === "DRIVER";

        setIsOnline(ok);

        if (!ok) {
          setDriverName("");
          setDriverEmail("");
          setDriverProfileImageUrl("");
          return;
        }

        let bestName = "";
        let bestEmail = "";
        let bestImage = "";

        try {
          const driverMe = await getDriverMe();
          if (!alive) return;

          bestName = String(driverMe?.user?.name ?? "").trim();
          bestEmail = String(driverMe?.user?.email ?? "").trim();
          bestImage = String(driverMe?.user?.profileImageUrl ?? "").trim();
        } catch {}

        if (!bestName) {
          bestName = String((me as any)?.user?.name ?? (me as any)?.name ?? "").trim();
        }

        if (!bestEmail) {
          bestEmail = String((me as any)?.user?.email ?? (me as any)?.email ?? "").trim();
        }

        setDriverName(bestName);
        setDriverEmail(bestEmail);
        setDriverProfileImageUrl(bestImage);
      } catch {
        if (!alive) return;
        setIsOnline(false);
        setDriverName("");
        setDriverEmail("");
        setDriverProfileImageUrl("");
      } finally {
        if (!alive) return;
        setCheckingMe(false);
      }
    }

    loadSessionState();

    const onAuthChanged = () => {
      loadSessionState();
      void (async () => {
        const next = await readActiveFromBackend();
        if (alive) setActive(next);
      })();
    };

    window.addEventListener("ct-auth-changed", onAuthChanged as any);
    window.addEventListener("auth:changed", onAuthChanged as any);

    return () => {
      alive = false;
      window.removeEventListener("ct-auth-changed", onAuthChanged as any);
      window.removeEventListener("auth:changed", onAuthChanged as any);
    };
  }, []);

  useEffect(() => {
    if (isPublic) {
      setActive(null);
      return;
    }

    let alive = true;

    async function loadActiveOrder() {
      const next = await readActiveFromBackend();
      if (!alive) return;
      setActive(next);
    }

    loadActiveOrder();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        loadActiveOrder();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    const t = window.setInterval(() => {
      loadActiveOrder();
    }, 5000);

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(t);
    };
  }, [isPublic]);

  const canShowSessionUI = useMemo(
    () => !isLogin && !checkingMe && isOnline,
    [isLogin, checkingMe, isOnline]
  );

  const isLoggedIn = canShowSessionUI;
  const menuCity = cityLabel || cityName || "Tu ciudad";
  const userInitials = getInitials(driverName || "Worker");
  const driverAvatarSrc = buildOfficialDriverPhotoSrc(driverProfileImageUrl, driverName);

  const openBlockedModal = () => {
    setModalError(null);
    setModalMode("BLOCKED");
    setModalOpen(true);
  };

  const openAssignedModal = () => {
    setModalError(null);
    setModalMode("ASSIGNED");
    setModalOpen(true);
  };

  const doLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await logoutDriver();
    } catch {}

    setLoggingOut(false);
    setMenuOpen(false);
    router.replace("/login");
  };

  const handleLogoutClick = async () => {
    const a = activeRef.current;

    if (!a?.order?.orderId) {
      await doLogout();
      return;
    }

    if (a.step === "EN_CAMINO" || a.step === "EN_RUTA") {
      openBlockedModal();
      return;
    }

    if (a.step === "ASIGNADO") {
      openAssignedModal();
      return;
    }

    await doLogout();
  };

  const handleReleaseAndLogout = async () => {
    const a = activeRef.current;
    const orderId = String(a?.order?.orderId ?? "").trim();
    if (!orderId) {
      setModalError("No encontramos la orden activa. Intenta nuevamente.");
      return;
    }

    setBusy(true);
    setModalError(null);

    try {
      const res = await driverReleaseOrder(orderId);

      if (!res?.ok) {
        setModalError("No pudimos liberar la orden. Intenta nuevamente o contacta Mesa de ayuda.");
        setBusy(false);
        return;
      }

      setActive(null);
      await doLogout();
    } catch {
      setModalError("Ocurrió un error liberando la orden. Intenta nuevamente.");
      setBusy(false);
    }
  };

  const openHelp = () => {
    const a = activeRef.current;
    const orderId = String(a?.order?.orderId ?? "").trim();

    const text = encodeURIComponent(
      `Hola Mesa de Ayuda KroniX. Soy Worker KRONIX y necesito apoyo.\n` +
        `Orden: ${orderId || "N/A"}\n` +
        `Estado app: ${a?.step || "N/A"}\n` +
        `Motivo: No puedo cerrar sesión porque tengo una orden en curso.`
    );

    const url = `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
        <div ref={menuWrapRef} className="relative w-full px-2 pt-0 pb-2">
          <div className="relative flex min-h-[68px] items-start">
            <div className="flex w-16 items-center justify-start pt-3">
              {showBack ? (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="grid h-11 w-11 place-items-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
                  aria-label="Volver"
                >
                  <span className="text-xl leading-none text-gray-700">←</span>
                </button>
              ) : (
                showMenu ? (
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="group relative grid h-12 w-12 place-items-center rounded-full border border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-md transition hover:shadow-lg"
                    aria-label="Abrir menú"
                  >
                    <span className="absolute inset-0 rounded-full ring-1 ring-black/5" />
                    <span className="relative flex h-5 w-5 flex-col items-center justify-center gap-[4px]">
                      <span
                        className={`block h-[2.5px] w-5 rounded-full bg-gray-700 transition-all duration-200 ${
                          menuOpen ? "translate-y-[6px] rotate-45" : ""
                        }`}
                      />
                      <span
                        className={`block h-[2.5px] w-5 rounded-full bg-gray-700 transition-all duration-200 ${
                          menuOpen ? "opacity-0" : ""
                        }`}
                      />
                      <span
                        className={`block h-[2.5px] w-5 rounded-full bg-gray-700 transition-all duration-200 ${
                          menuOpen ? "-translate-y-[6px] -rotate-45" : ""
                        }`}
                      />
                    </span>
                  </button>
                ) : null
              )}
            </div>

            <Link
  href="/"
  className="absolute left-1/2 top-[2px] flex -translate-x-1/2 flex-col items-center"
  aria-label="Ir a inicio"
>
  <div className="relative h-[54px] w-[170px] shrink-0 overflow-visible">
    {hasLogo ? (
      <Image
        src="/branding/kronix/kronix-logo.png"
        alt="KroniX"
        fill
        className="object-contain scale-[1.2] translate-x-[-14px] translate-y-3"
        onError={() => setHasLogo(false)}
        priority
      />
    ) : (
      <div className="h-full w-full rounded-2xl bg-green-600" />
    )}
  </div>

  </Link>

            <div className="ml-auto flex w-[74px] flex-col items-center justify-start pt-2">
  <Link
    href="/profile"
    className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100"
    aria-label="Ir a Perfil"
    title="Perfil"
  >
    {isLoggedIn ? (
      <OfficialDriverAvatar
        src={driverAvatarSrc}
        initials={userInitials}
        className="relative h-full w-full overflow-hidden rounded-full"
      />
    ) : (
      <Image
        src="/avatar/default.png"
        alt="Worker"
        fill
        className="object-cover"
        sizes="42px"
        priority
      />
    )}
  </Link>

  {checkingMe ? (
    <div className="mt-1 text-[11px] font-semibold leading-none text-gray-400">
      …
    </div>
  ) : isLoggedIn ? (
    <div className="mt-1 flex items-center gap-1 px-1 py-[2px]">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      <span className="text-[11px] font-extrabold leading-none text-green-700">
        Conectado
      </span>
    </div>
  ) : (
    <Link
      href="/login?next=/"
      className="mt-1 whitespace-nowrap text-[11px] font-extrabold leading-none text-blue-700 hover:underline"
    >
      Iniciar sesión
    </Link>
  )}
</div>
          </div>

          {showMenu && menuOpen ? (
            <div
              className={`absolute left-4 right-4 top-[96px] z-50 overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-2xl transition-all duration-300 ${
                menuOpen
                  ? "pointer-events-auto max-h-[calc(100dvh-11.5rem)] opacity-100"
                  : "pointer-events-none max-h-0 opacity-0"
              }`}
            >
              <div className="no-scrollbar max-h-[calc(100dvh-11.5rem)] overflow-y-auto">
                <div className="border-b border-gray-100 bg-gradient-to-r from-blue-600 via-blue-500 to-green-500 px-4 py-2 text-white">
                  <div className="flex items-center gap-3">
                    {isLoggedIn ? (
                      <OfficialDriverAvatar
                        src={driverAvatarSrc}
                        initials={userInitials}
                        className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-white/20 font-extrabold ring-1 ring-white/20"
                      />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-white/20 font-extrabold ring-1 ring-white/20">
                        KR
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-lg font-extrabold">
                        {isLoggedIn ? (driverName || "Worker") : "KroniX Worker"}
                      </div>
                      <div className="truncate text-sm text-white/90">
                        {isLoggedIn ? (driverEmail || menuCity) : menuCity}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white">
                  <MenuLinkRow
                    href="/"
                    title="Inicio"
                    subtitle="Pantalla principal"
                    icon="🏠"
                    active={isPathActive(pathname, "/")}
                    onNavigate={() => setMenuOpen(false)}
                  />

                  <MenuLinkRow
                    href="/history"
                    title="Historial"
                    subtitle="Tus entregas y estados"
                    icon="🧾"
                    active={isPathActive(pathname, "/history")}
                    onNavigate={() => setMenuOpen(false)}
                  />

                  <MenuLinkRow
                    href="/earnings"
                    title="Ganancias"
                    subtitle="Pagos semanales y movimientos"
                    icon="💰"
                    active={isPathActive(pathname, "/earnings")}
                    onNavigate={() => setMenuOpen(false)}
                  />

                  <MenuLinkRow
                    href="/profile"
                    title="Perfil"
                    subtitle="Cuenta y configuración"
                    icon="👤"
                    active={isPathActive(pathname, "/profile")}
                    onNavigate={() => setMenuOpen(false)}
                  />

                  <MenuLinkRow
                    href="/profile/info"
                    title="Tu información"
                    subtitle="Datos personales básicos"
                    icon="📄"
                    active={isPathActive(pathname, "/profile/info")}
                    onNavigate={() => setMenuOpen(false)}
                  />

                  <MenuLinkRow
                    href="/profile/cars"
                    title="Servicios y vehículos"
                    subtitle="Tipos autorizados y documentos"
                    icon="🚘"
                    active={isPathActive(pathname, "/profile/cars")}
                    onNavigate={() => setMenuOpen(false)}
                  />

                  <MenuLinkRow
                    href="/profile/pay-info"
                    title="Información de pago"
                    subtitle="Tu método de pago semanal"
                    icon="💳"
                    active={isPathActive(pathname, "/profile/pay-info")}
                    onNavigate={() => setMenuOpen(false)}
                  />

                  <MenuLinkRow
                    href="/profile/security"
                    title="Seguridad"
                    subtitle="Contraseña y sesiones"
                    icon="🔒"
                    active={isPathActive(pathname, "/profile/security")}
                    onNavigate={() => setMenuOpen(false)}
                  />

                  <MenuLinkRow
                    href="/profile/instructions"
                    title="Instructivo"
                    subtitle="Guías rápidas del conductor"
                    icon="📘"
                    active={isPathActive(pathname, "/profile/instructions")}
                    onNavigate={() => setMenuOpen(false)}
                  />

                  <MenuLinkRow
                    href="/profile/support"
                    title="Soporte"
                    subtitle="Ayuda y contacto"
                    icon="🛟"
                    active={isPathActive(pathname, "/profile/support")}
                    onNavigate={() => setMenuOpen(false)}
                  />

                  <div className="border-t border-gray-200" />

                  {isLoggedIn ? (
                    <MenuActionRow
                      title={loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                      subtitle="Salir de tu cuenta Worker"
                      icon="🚪"
                      tone="danger"
                      onClick={async () => {
                        setMenuOpen(false);
                        await handleLogoutClick();
                      }}
                    />
                  ) : (
                    <MenuActionRow
                      title="Iniciar sesión"
                      subtitle="Accede con tu cuenta Worker"
                      icon="🔑"
                      tone="primary"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/login");
                      }}
                    />
                  )}
                </div>
              </div>

              <style jsx>{`
                .no-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </div>
          ) : null}
        </div>
      </header>

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 px-6 pt-6 pb-6 text-white">
              <div className="text-lg font-extrabold">
                {modalMode === "BLOCKED"
                  ? "No puedes cerrar sesión ahora"
                  : "Orden asignada detectada"}
              </div>
              <div className="mt-1 text-sm text-white/90">
                {modalMode === "BLOCKED"
                  ? "Tienes una orden en curso. Para evitar abandono, el cierre de sesión está bloqueado."
                  : "Puedes liberar la orden (antes de iniciarla) y luego cerrar sesión de forma segura."}
              </div>
            </div>

            <div className="px-6 pb-6 -mt-4">
              <div className="rounded-3xl bg-white p-5 shadow-lg">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-600">
                  Orden
                </div>

                <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                  <div className="font-semibold text-gray-900">
                    #{String(active?.order?.orderId ?? "—")}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Estado app:{" "}
                    <span className="font-extrabold text-gray-900">
                      {String(active?.step ?? "—")}
                    </span>
                  </div>
                </div>

                {modalError ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                    {modalError}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-2">
                  {modalMode === "ASSIGNED" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleReleaseAndLogout}
                      className={[
                        "w-full rounded-2xl py-3 text-sm font-extrabold text-white transition-all duration-200",
                        "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]",
                        busy ? "cursor-not-allowed opacity-60" : "",
                      ].join(" ")}
                    >
                      {busy ? "Liberando…" : "Liberar y cerrar sesión"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openHelp}
                      className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 active:scale-[0.98]"
                    >
                      Contactar Mesa de ayuda
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setModalMode(null);
                      setModalError(null);
                      setBusy(false);
                    }}
                    className="w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-extrabold text-gray-800 hover:bg-gray-50"
                  >
                    Volver
                  </button>
                </div>

                <p className="mt-4 text-[11px] text-gray-500">
                  * Regla: el Worker puede cancelar/liberar solo antes de iniciar. Si ya inició, debe pasar por Mesa de ayuda.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}