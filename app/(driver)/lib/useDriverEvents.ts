// app/(driver)/lib/useDriverEvents.ts
"use client";

import { useEffect, useRef } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API || "http://localhost:3004";

export type OrderUpdatedEvent = {
  type: "order.updated";
  payload: {
    id: string;
    status?: string;
    flowStatus?: string;
    customerId?: string;
    updatedAt?: string;
  };
};

type Handlers = {
  onAnyEvent?: () => void;
  onOrderUpdated?: (e: OrderUpdatedEvent["payload"]) => void;
};

export function useDriverEvents(handlers: Handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/events/stream?role=driver`);

    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as OrderUpdatedEvent;

        if (data?.type === "order.updated") {
          handlersRef.current.onOrderUpdated?.(data.payload);
        }

        handlersRef.current.onAnyEvent?.();
      } catch {
        // ignoramos eventos no parseables (heartbeat, etc.)
      }
    };

    es.onerror = () => {
      // EventSource reintenta automáticamente
    };

    return () => {
      es.close();
    };
  }, []);
}
