//app\pwa-register.tsx
"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registration failed:", err));
    });
  }, []);

  return null;
}