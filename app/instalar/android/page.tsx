"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type InstallState =
  | "checking"
  | "ready"
  | "installed"
  | "browser-not-ready"
  | "wrong-browser"
  | "ios"
  | "unsupported";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const WORKER_URL = "https://driver.kronix.co";
const ANDROID_INSTALL_URL = `${WORKER_URL}/instalar/android`;
const CHROME_INTENT_URL =
  "intent://driver.kronix.co/instalar/android#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fdriver.kronix.co%2Finstalar%2Fandroid;end";
const INSTALL_PROMPT_KEY = "__KRONIX_DRIVER_INSTALL_PROMPT__";
const INSTALL_MARKER_KEY = "kronix-driver-installed";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)")?.matches || (window.navigator as any).standalone === true;
}

function hasInstalledMarker() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(INSTALL_MARKER_KEY) === "1";
}

function isIOSDevice() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  return /iphone|ipad|ipod/i.test(ua) || (platform === "MacIntel" && Number((window.navigator as any).maxTouchPoints || 0) > 1);
}

function isAndroidDevice() {
  if (typeof window === "undefined") return false;
  return /android/i.test(window.navigator.userAgent || "");
}

function isChromeAndroidBrowser() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";

  const hasChrome = /Chrome\//i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  const isEdge = /EdgA\//i.test(ua) || /Edg\//i.test(ua);
  const isOpera = /OPR\//i.test(ua) || /Opera/i.test(ua);
  const isFirefox = /Firefox\//i.test(ua);
  const isWebView = /; wv\)/i.test(ua) || /Version\/\d+\.\d+.*Chrome\//i.test(ua);

  return hasChrome && !isSamsung && !isEdge && !isOpera && !isFirefox && !isWebView;
}

function getStoredPrompt() {
  if (typeof window === "undefined") return null;
  return ((window as any)[INSTALL_PROMPT_KEY] as BeforeInstallPromptEvent | null) ?? null;
}

export default function AndroidInstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<InstallState>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const installed = state === "installed";
  const wrongBrowser = state === "wrong-browser";

  const installLabel = useMemo(() => {
    if (busy) return "Abriendo instalación…";
    return "Instalar app KRONIX";
  }, [busy]);

  useEffect(() => {
    const setInstalledState = (text: string) => {
      setDeferredPrompt(null);
      setState("installed");
      setMessage(text);
      window.localStorage.setItem(INSTALL_MARKER_KEY, "1");
    };

    const useAvailablePrompt = () => {
      const storedPrompt = getStoredPrompt();
      if (!storedPrompt) return false;

      setDeferredPrompt(storedPrompt);
      setState("ready");
      setMessage("Listo. Toca el botón verde para instalar la app KRONIX.");
      return true;
    };

    if (isStandaloneMode() || hasInstalledMarker()) {
      setInstalledState("La app de trabajadores KRONIX ya está instalada y lista para usarse.");
      return;
    }

    if (isIOSDevice()) {
      setState("ios");
      setMessage("Este teléfono parece ser iPhone o iPad. Usa la guía para iPhone.");
      return;
    }

    if (!isAndroidDevice()) {
      setState("unsupported");
      setMessage("Esta página está optimizada para Android. También puedes abrir la app KRONIX desde el navegador.");
    } else if (!isChromeAndroidBrowser()) {
      setState("wrong-browser");
      setMessage("Para instalar la app KRONIX, abre esta página en Google Chrome.");
    } else if (!useAvailablePrompt()) {
      setState("browser-not-ready");
      setMessage("Preparando el instalador… Si no aparece, usa el menú ⋮ de Chrome y toca Instalar app.");
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      (window as any)[INSTALL_PROMPT_KEY] = promptEvent;
      setDeferredPrompt(promptEvent);
      setState("ready");
      setMessage("Listo. Toca el botón verde para instalar la app KRONIX.");
    };

    const onInstallReady = () => {
      useAvailablePrompt();
    };

    const onAppInstalled = () => {
      setInstalledState("La app de trabajadores KRONIX quedó instalada correctamente.");
    };

    const onDisplayModeChange = () => {
      if (isStandaloneMode()) {
        setInstalledState("La app de trabajadores KRONIX ya está instalada y lista para usarse.");
      }
    };

    const media = window.matchMedia?.("(display-mode: standalone)");

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("kronix-driver-install-ready", onInstallReady);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("kronix-driver-installed", onAppInstalled);
    media?.addEventListener?.("change", onDisplayModeChange);

    const fallbackTimer = window.setTimeout(() => {
      if (getStoredPrompt()) useAvailablePrompt();
    }, 1200);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("kronix-driver-install-ready", onInstallReady);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("kronix-driver-installed", onAppInstalled);
      media?.removeEventListener?.("change", onDisplayModeChange);
    };
  }, []);

  async function handleInstall() {
    const promptEvent = deferredPrompt ?? getStoredPrompt();

    if (!promptEvent || busy) {
      setState("browser-not-ready");
      setMessage("El instalador automático aún no está disponible. Usa el menú ⋮ de Chrome y toca Instalar app.");
      return;
    }

    setBusy(true);
    setMessage("Confirma la instalación cuando Android te lo pregunte.");

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      (window as any)[INSTALL_PROMPT_KEY] = null;
      setDeferredPrompt(null);

      if (choice.outcome === "accepted") {
        window.localStorage.setItem(INSTALL_MARKER_KEY, "1");
        setState("installed");
        setMessage("La app de trabajadores KRONIX quedó instalada correctamente.");
      } else {
        setState("browser-not-ready");
        setMessage("Instalación cancelada. Puedes intentarlo nuevamente desde el menú ⋮ de Chrome.");
      }
    } catch {
      setState("browser-not-ready");
      setMessage("No pudimos abrir el instalador automático. Usa el menú ⋮ de Chrome y toca Instalar app.");
    } finally {
      setBusy(false);
    }
  }

  const canInstall = Boolean(deferredPrompt) && !busy && state === "ready";

  return (
    <main className="min-h-screen overflow-y-auto bg-[#f3f6fb] px-4 py-5 text-slate-950">
      <section className="mx-auto w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_46px_rgba(15,23,42,0.16)]">
        <div className="relative overflow-hidden px-5 pb-6 pt-4 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#03102b_0%,#0b356d_48%,#4a79b7_78%,#ffffff_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-90">
            <span className="absolute left-[12%] top-[22%] h-1 w-1 rounded-full bg-white" />
            <span className="absolute left-[40%] top-[16%] h-1 w-1 rounded-full bg-white" />
            <span className="absolute right-[18%] top-[26%] h-1 w-1 rounded-full bg-white" />
          </div>

          <div className="relative flex items-center justify-between gap-3">
            <Link href="/profile" className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10 text-xl shadow-sm backdrop-blur">←</Link>
            <img src="/branding/kronix/header-logo.png" alt="KroniX" className="h-16 w-44 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]" />
            <div className="h-11 w-11 rounded-full border border-white/25 bg-white/10" />
          </div>

          <div className="relative mt-3 text-center">
            <div className="text-[26px] font-black leading-tight">Instalar app KRONIX</div>
            <div className="mt-1 text-sm font-semibold text-white/90">Android · App de trabajadores</div>
          </div>
        </div>

        <div className="space-y-3 px-5 pb-5">
          {installed ? (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-center shadow-sm">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-emerald-100">✅</div>
              <img src="/icons/kronix-icon.png" alt="Ícono KroniX" className="mx-auto mt-4 h-24 w-24 rounded-[24px] object-contain shadow-[0_14px_30px_rgba(15,23,42,0.20)] ring-1 ring-white" />
              <h1 className="mt-4 text-xl font-black text-slate-950">La app ya está instalada</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">¡Perfecto! La app de trabajadores está disponible en tu teléfono.</p>
              <a href={WORKER_URL} className="mt-4 block rounded-2xl bg-blue-700 px-4 py-4 text-base font-black text-white">Abrir app KRONIX</a>
            </div>
          ) : wrongBrowser ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-center shadow-sm">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-amber-100">🛡️</div>
              <h1 className="mt-3 text-xl font-black text-slate-950">Instala desde Google Chrome</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">Abre esta página en Chrome para instalar KRONIX como aplicación web segura.</p>
              <a href={CHROME_INTENT_URL} className="mt-4 block rounded-2xl bg-emerald-600 px-4 py-4 text-base font-black text-white shadow-[0_12px_28px_rgba(5,150,105,0.25)]">Abrir en Google Chrome</a>
              <a href={ANDROID_INSTALL_URL} className="mt-2 block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800">Abrir enlace de instalación</a>
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-blue-100">📱</div>
                <h1 className="mt-3 text-xl font-black text-slate-950">KRONIX en tu pantalla</h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Instala la app directamente desde Google Chrome. No necesitas descargar APK.</p>
              </div>

              <button type="button" onClick={handleInstall} disabled={!canInstall} className="w-full rounded-2xl bg-emerald-600 px-4 py-4 text-base font-black text-white shadow-[0_12px_28px_rgba(5,150,105,0.25)] transition active:scale-[0.99] hover:bg-emerald-700 disabled:bg-emerald-300 disabled:shadow-none">
                {installLabel}
              </button>
            </>
          )}

          {message && !installed ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold leading-5 text-slate-700">{message}</div> : null}

          {!installed && !wrongBrowser ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-black text-slate-900">Instalación manual</div>
              <ol className="mt-2 space-y-2 text-sm font-semibold leading-5 text-slate-600">
                <li>1. Abre esta página en Google Chrome.</li>
                <li>2. Toca el menú ⋮ arriba a la derecha.</li>
                <li>3. Toca “Instalar app” o “Agregar a pantalla principal”.</li>
              </ol>
            </div>
          ) : null}

          <Link href="/instalar/iphone" className="block rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-800">Tengo iPhone</Link>
        </div>
      </section>
    </main>
  );
}
