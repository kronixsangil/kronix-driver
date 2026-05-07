// app/(driver)/lib/driverHistory.ts
"use client";

import { apiFetch } from "../../../lib/apiFetch";

export type DriverHistoryStatus = "DELIVERED" | "CANCELLED";

export type DriverHistoryItem = {
  historyId: string;
  id: string; // orderId
  storeName: string;
  payoutCOP: number;
  deliveredAtISO: string;
  status: DriverHistoryStatus;
  payoutSource?: "SNAPSHOT" | "MISSING";
};

type BackendHistoryRow = {
  id: string;
  deliveredAtISO: string;
  status: "DELIVERED" | "CANCELLED" | string;
  storeName: string;
  payoutCOP: number;
  payoutSource?: "SNAPSHOT" | "MISSING" | "NONE";
};

function normalizeRow(r: BackendHistoryRow): DriverHistoryItem | null {
  const oid = String(r?.id ?? "").trim();
  if (!oid) return null;

  const deliveredAtISO =
    String(r?.deliveredAtISO ?? "").trim() || new Date().toISOString();

  const storeName = String(r?.storeName ?? "Comercio").trim() || "Comercio";

  const payout = Number(r?.payoutCOP);
  const payoutCOP = Number.isFinite(payout) ? Math.max(0, Math.round(payout)) : 0;

  const status =
    String(r?.status ?? "").toUpperCase() === "CANCELLED" ? "CANCELLED" : "DELIVERED";

  const payoutSource = r?.payoutSource === "SNAPSHOT" ? "SNAPSHOT" : "MISSING";

  return {
    historyId: `db_${oid}`,
    id: oid,
    storeName,
    payoutCOP,
    deliveredAtISO,
    status,
    payoutSource,
  };
}

/**
 * ✅ Fuente de verdad: Backend (BD) usando cookies (apiFetch)
 * - NO usa accessToken en localStorage
 * - Mantiene el flujo correcto: cookies + refresh + x-ct-app=driver
 */
export async function loadDriverHistoryWithSnapshot(): Promise<DriverHistoryItem[]> {
  try {
    const data = await apiFetch<BackendHistoryRow[]>("/drivers/history", {
      method: "GET",
      cache: "no-store",
    });

    const rows = Array.isArray(data) ? data : [];
    return rows.map(normalizeRow).filter(Boolean) as DriverHistoryItem[];
  } catch {
    return [];
  }
}

/**
 * ✅ Compat: algunos archivos todavía importan loadDriverHistory().
 * Como esto es síncrono, devolvemos [].
 */
export function loadDriverHistory(): DriverHistoryItem[] {
  return [];
}

export function saveDriverHistory(_: DriverHistoryItem[]) {
  // no-op
}

export function addDriverHistoryItem(_: Omit<DriverHistoryItem, "historyId">) {
  // no-op
}