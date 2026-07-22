"use client";

import { useEffect, useRef } from "react";
import { apiFetch } from "../lib/apiFetch";
import { playDriverSound } from "./(driver)/lib/sound";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const INSTALL_PROMPT_KEY = "__KRONIX_DRIVER_INSTALL_PROMPT__";
const INSTALL_MARKER_KEY = "kronix-driver-installed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function ensureServiceWorker() {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;

  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });

  await navigator.serviceWorker.ready;
  return registration;
}

async function registerDriverPush() {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  if (!("Notification" in window)) return false;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidKey) {
    console.warn("[Driver Push] Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY");
    return false;
  }

  const registration = await ensureServiceWorker();
  if (!registration) return false;

  let permission = Notification.permission;

  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    console.warn("[Driver Push] Permiso no concedido:", permission);
    return false;
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  await apiFetch("/push/subscribe", {
    method: "POST",
    body: JSON.stringify({
      app: "driver",
      subscription: subscription.toJSON(),
      userAgent: navigator.userAgent,
    }),
  });

  console.log("[Driver Push] Suscripción registrada correctamente");
  return true;
}

function playForegroundPushSound(payload: any) {
  const sound = String(payload?.sound ?? "").toLowerCase();

  if (sound.includes("new") || sound.includes("order")) {
    playDriverSound("NEW_AVAILABLE", 500);
    return;
  }

  if (sound.includes("assigned")) {
    playDriverSound("ASSIGNED", 500);
    return;
  }

  if (sound.includes("pickup")) {
    playDriverSound("PICKUP", 500);
    return;
  }

  if (sound.includes("en-route") || sound.includes("route")) {
    playDriverSound("EN_ROUTE", 500);
    return;
  }

  if (sound.includes("delivered")) {
    playDriverSound("DELIVERED", 500);
    return;
  }

  if (sound.includes("cancelled") || sound.includes("canceled")) {
    playDriverSound("CANCELLED", 500);
    return;
  }

  playDriverSound("GENERIC", 500);
}

export default function PwaRegister() {
  const registeredRef = useRef(false);
  const triesRef = useRef(0);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      (window as any)[INSTALL_PROMPT_KEY] = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new CustomEvent("kronix-driver-install-ready"));
    };

    const onAppInstalled = () => {
      (window as any)[INSTALL_PROMPT_KEY] = null;
      window.localStorage.setItem(INSTALL_MARKER_KEY, "1");
      window.dispatchEvent(new CustomEvent("kronix-driver-installed"));
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    void ensureServiceWorker().catch((error) => {
      console.warn("[Driver PWA] No se pudo registrar el Service Worker:", error);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    const onServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type !== "KRONIX_DRIVER_PUSH_FOREGROUND") return;
      playForegroundPushSound(event.data?.payload);
    };

    navigator.serviceWorker?.addEventListener("message", onServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", onServiceWorkerMessage);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryRegister = async () => {
      if (!alive || registeredRef.current) return;

      triesRef.current += 1;

      try {
        const ok = await registerDriverPush();

        if (ok) {
          registeredRef.current = true;
          return;
        }
      } catch (err) {
        console.warn("[Driver Push] No se pudo registrar todavía:", err);
      }

      if (!registeredRef.current && triesRef.current < 12) {
        timer = setTimeout(tryRegister, 5000);
      }
    };

    timer = setTimeout(tryRegister, 1500);

    const onFocus = () => {
      if (!registeredRef.current) void tryRegister();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !registeredRef.current) {
        void tryRegister();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
