// app/(driver)/lib/driverOrderApi.ts
import { apiFetch } from "../../../lib/apiFetch";

export type DriverOrderStatus =
  | "ASSIGNED"
  | "EN_ROUTE"
  | "DELIVERED"
  | "CANCELLED";

// ✅ SOLO órdenes pagadas y disponibles (sin depender de flowStatus)
export async function driverFetchAvailableOrders(): Promise<any[]> {
  try {
    const data = await apiFetch<any[]>(
      `/drivers/orders/available`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      }
    );

    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

// ✅ ASSIGN (driverId sale del JWT en backend)
export async function driverAssignOrder(orderId: string) {
  try {
    const data = await apiFetch(
      `/drivers/orders/${orderId}/assign`,
      {
        method: "POST",
        body: JSON.stringify({}),
        cache: "no-store",
        credentials: "include",
      }
    );

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e };
  }
}

// ✅ STATUS (driverId sale del JWT en backend)
export async function driverUpdateOrderStatus(
  orderId: string,
  status: DriverOrderStatus
) {
  try {
    const data = await apiFetch(
      `/drivers/orders/${orderId}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status }),
        cache: "no-store",
        credentials: "include",
      }
    );

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e };
  }
}

// ✅ RELEASE (driverId sale del JWT en backend)
export async function driverReleaseOrder(orderId: string) {
  try {
    const data = await apiFetch(
      `/drivers/orders/${orderId}/release`,
      {
        method: "POST",
        body: JSON.stringify({}),
        cache: "no-store",
        credentials: "include",
      }
    );

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e };
  }
}

// ✅ 6.2 Reportar ubicación GPS (sin driverId en body: backend lo toma del JWT si aplica)
export async function driverReportLocation(
  orderId: string,
  lat: number,
  lng: number
) {
  try {
    const data = await apiFetch(
      `/orders/${orderId}/driver-location`,
      {
        method: "POST",
        body: JSON.stringify({ lat, lng }),
        cache: "no-store",
        credentials: "include",
      }
    );

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e };
  }
}