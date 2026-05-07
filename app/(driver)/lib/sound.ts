// src/app/(driver)/lib/sound.ts
"use client";

export type DriverSoundId = "NEW_AVAILABLE" | "ASSIGNED" | "TIMEOUT_SOON" | "GENERIC";

let lastPlayedAt: Record<DriverSoundId, number> = {
  NEW_AVAILABLE: 0,
  ASSIGNED: 0,
  TIMEOUT_SOON: 0,
  GENERIC: 0,
};

let newOrderAudio: HTMLAudioElement | null = null;
let notifyAudio: HTMLAudioElement | null = null;

function getAudioFor(id: DriverSoundId) {
  if (typeof window === "undefined") return null;

  if (id === "NEW_AVAILABLE") {
    if (!newOrderAudio) {
      newOrderAudio = new Audio("/sounds/new-order.mp3");
      newOrderAudio.preload = "auto";
      newOrderAudio.volume = 1;
    }
    return newOrderAudio;
  }

  if (!notifyAudio) {
    notifyAudio = new Audio("/sounds/notify.mp3");
    notifyAudio.preload = "auto";
    notifyAudio.volume = 1;
  }

  return notifyAudio;
}

// Evita spam de sonidos
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
      // silencioso: algunos navegadores exigen interacción previa del usuario
    });
  } catch {
    // silencioso
  }
}