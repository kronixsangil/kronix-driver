//app/(driver)/lib/driverSync.ts
export type DriverSyncEvent = {
  orderId: string;
  status: "EN_CAMINO" | "EN_RUTA" | "ENTREGADO";
  at: number;
};

const KEY = "order_sync_events_v1";

export function pushDriverSyncEvent(event: DriverSyncEvent) {
  try {
    const raw = localStorage.getItem(KEY);
    const events: DriverSyncEvent[] = raw ? JSON.parse(raw) : [];
    events.unshift(event); // el más nuevo arriba
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch (e) {
    console.error("Error guardando driver sync event", e);
  }
}
