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

  try {
    new Notification(title, { body });
  } catch {
    // nada
  }
}