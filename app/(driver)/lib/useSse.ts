// app/(driver)/lib/useSse.ts
"use client";

import { useEffect, useRef } from "react";

type UseSseArgs = {
  url: string | null;
  onMessage?: (ev: MessageEvent) => void;
  onError?: (ev: Event) => void;
  enabled?: boolean;
};

export function useSse({ url, onMessage, onError, enabled = true }: UseSseArgs) {
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  onMessageRef.current = onMessage;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled) return;
    if (!url) return;

    let closed = false;
    const es = new EventSource(url, { withCredentials: true });

    es.onmessage = (ev) => {
      if (closed) return;
      onMessageRef.current?.(ev);
    };

    es.onerror = (ev) => {
      if (closed) return;
      onErrorRef.current?.(ev);
    };

    return () => {
      closed = true;
      es.close();
    };
  }, [url, enabled]);
}