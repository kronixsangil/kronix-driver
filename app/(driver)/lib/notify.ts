// src/app/(driver)/lib/notify.ts
"use client";

export async function ensureNotifyPermission() {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  try {
    const p = await Notification.requestPermission();
    return p === "granted";
  } catch {
    return false;
  }
}

export function showNotify(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // ✅ CLAVE:
  // Si la app está abierta en primer plano, NO lanzamos notificación del sistema,
  // porque esa notificación usa el sonido del sistema y tapa/confunde el MP3 interno.
  if (document.visibilityState === "visible") {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: "/kronix-icon.png",
      badge: "/kronix-icon.png",
      tag: "kronix-driver",
    });
  } catch {
    // nada
  }
}