// app/(driver)/lib/useSse.ts
"use client";

import { useEffect } from "react";

type UseSseArgs = {
  url: string | null;
  onMessage?: (ev: MessageEvent) => void;
  onError?: (ev: Event) => void;
  enabled?: boolean;
};

export function useSse({ url, onMessage, onError, enabled = true }: UseSseArgs) {
  useEffect(() => {
    if (!enabled) return;
    if (!url) return;

    let closed = false;

    // ✅ CLAVE: enviar cookies (ct_at/ct_sid/ct_rt) en SSE cross-origin
    const es = new EventSource(url, { withCredentials: true });

    es.onmessage = (ev) => {
      if (closed) return;
      onMessage?.(ev);
    };

    es.onerror = (ev) => {
      if (closed) return;
      onError?.(ev);
      // nota: EventSource reintenta solo automáticamente
    };

    return () => {
      closed = true;
      es.close();
    };
  }, [url, enabled, onMessage, onError]);
}

