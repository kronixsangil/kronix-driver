// src/app/(driver)/lib/sound.ts
"use client";

export type DriverSoundId =
  | "NEW_AVAILABLE"
  | "ASSIGNED"
  | "PICKUP"
  | "EN_ROUTE"
  | "DELIVERED"
  | "CANCELLED"
  | "TIMEOUT_SOON"
  | "GENERIC";

const SOUND_BY_ID: Record<DriverSoundId, string> = {
  NEW_AVAILABLE: "/sounds/driver-new-order.mp3",
  ASSIGNED: "/sounds/driver-assigned.mp3",
  PICKUP: "/sounds/driver-pickup.mp3",
  EN_ROUTE: "/sounds/driver-en-route.mp3",
  DELIVERED: "/sounds/driver-delivered.mp3",
  CANCELLED: "/sounds/driver-cancelled.mp3",
  TIMEOUT_SOON: "/sounds/driver-default.mp3",
  GENERIC: "/sounds/driver-default.mp3",
};

let lastPlayedAt: Record<DriverSoundId, number> = {
  NEW_AVAILABLE: 0,
  ASSIGNED: 0,
  PICKUP: 0,
  EN_ROUTE: 0,
  DELIVERED: 0,
  CANCELLED: 0,
  TIMEOUT_SOON: 0,
  GENERIC: 0,
};

const audioMap = new Map<DriverSoundId, HTMLAudioElement>();

function getAudioFor(id: DriverSoundId) {
  if (typeof window === "undefined") return null;

  const existing = audioMap.get(id);
  if (existing) return existing;

  const audio = new Audio(SOUND_BY_ID[id] || SOUND_BY_ID.GENERIC);
  audio.preload = "auto";
  audio.volume = 1;

  audioMap.set(id, audio);
  return audio;
}

export function playDriverSound(id: DriverSoundId, cooldownMs = 2500) {
  try {
    const now = Date.now();

    if (now - (lastPlayedAt[id] || 0) < cooldownMs) return;

    lastPlayedAt[id] = now;

    const audio = getAudioFor(id);
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;

    void audio.play().catch(() => {
      // Algunos navegadores exigen interacción previa del usuario.
    });
  } catch {
    // Silencioso para no romper la app.
  }
}