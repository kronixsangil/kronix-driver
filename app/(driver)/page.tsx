// app/(driver)/page.tsx
"use client";

import AvailableOrderCard from "../(driver)/orders/components/AvailableOrderCard";
import {
  driverAssignOrder,
  driverReleaseOrder,
  driverReportLocation,
  driverUpdateOrderStatus,
} from "../(driver)/lib/driverOrderApi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssignedOrderCard from "../(driver)/orders/components/AssignedOrderCard";
import PickupOrderCard from "../(driver)/orders/components/PickupOrderCard";
import EnRouteOrderCard from "../(driver)/orders/components/EnRouteOrderCard";
import DeliveredOrderCard from "../(driver)/orders/components/DeliveredOrderCard";
import { addDriverHistoryItem } from "../(driver)/lib/driverHistory";
import type { GeoPoint, DriverOrder } from "../(driver)/lib/types";
import { useSse } from "../(driver)/lib/useSse";
import Image from "next/image";
import { apiFetch } from "../../lib/apiFetch";
import { driverFetchAvailableOrders } from "../(driver)/lib/driverOrderApi";
import { playDriverSound } from "../(driver)/lib/sound";
import { ensureNotifyPermission, showNotify } from "../(driver)/lib/notify";
import { useDriverCity } from "./components/DriverCityContext";

import {
  checkDriverPrivacyStatus
} from "./lib/driverPrivacyLegal";

import {
  checkDriverIndependenceStatus
} from "./lib/driverIndependenceLegal";

import { checkDriverTermsStatus } from "./lib/driverTermsLegal";



type AvailableOrderStore = {
  storeId: string;
  name: string;
  phone1: string;
  phone2: string;
  address: string;
  lat: number;
  lng: number;
  sequence: number;
};

type AvailableOrderCustomer = {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  email: string;
};

type ReadyPickupStoreNotice = {
  storeId?: string | null;
  storeName: string;
  updatedAt?: string | null;
};

type AvailableOrder = {
  orderId: string;
  stores: AvailableOrderStore[];
  customer: AvailableOrderCustomer;
  distanceKm?: number;
  deliveryFee: number;
  tip?: number;
  orderType?: string | null;
  courierServiceType?: "PICKUP_AND_DELIVERY" | "SEND_PACKAGE" | "ERRAND" | string | null;
  createdAt: number;
  pickupLocations?: GeoPoint[];
  pickupLocation?: GeoPoint;
  dropoffLocation?: GeoPoint;
  routeAddresses?: string[];
  customerAddress?: string;
  customerNote?: string;
  packageDescription?: string;
  status?: string;
  flowStatus?: string;
  cityId?: string | null;
  assignedAt?: string | null;
  deliveredAt?: string | null;
  driverLat?: number | null;
  driverLng?: number | null;
  driverLocationUpdatedAt?: string | null;
  readyForPickupStores?: ReadyPickupStoreNotice[];
  [k: string]: unknown;
};

type DriverActiveOrderResponse = {
  ok: boolean;
  activeOrder: AvailableOrder | null;
};

type DriverMeResponse = {
  id?: string;
  userId?: string;
  name?: string | null;
  phone?: string | null;
};

type ActiveState = {
  order: AvailableOrder;
  step: "ASIGNADO" | "EN_CAMINO" | "EN_RUTA" | "ENTREGADO";
};

type DriverReadyMap = Record<
  string,
  {
    stores: ReadyPickupStoreNotice[];
  }
>;

const READY_PICKUP_DRIVER_STORAGE_KEY = "ct_driver_ready_orders_v2";
const API_BASE = process.env.NEXT_PUBLIC_API || "http://localhost:3004";


const STEP_RANK: Record<ActiveState["step"], number> = {
  ASIGNADO: 0,
  EN_CAMINO: 1,
  EN_RUTA: 2,
  ENTREGADO: 3,
};

function maxStep(a: ActiveState["step"], b: ActiveState["step"]) {
  return STEP_RANK[a] >= STEP_RANK[b] ? a : b;
}

function haversineKm(a: GeoPoint, b: GeoPoint) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

function sumRouteKm(pickups: GeoPoint[], dropoff?: GeoPoint) {
  const points: GeoPoint[] = [...pickups];
  if (dropoff && Number.isFinite(dropoff.lat) && Number.isFinite(dropoff.lng)) points.push(dropoff);
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (
      !a ||
      !b ||
      !Number.isFinite(a.lat) ||
      !Number.isFinite(a.lng) ||
      !Number.isFinite(b.lat) ||
      !Number.isFinite(b.lng)
    ) {
      continue;
    }
    total += haversineKm(a, b);
  }
  return total;
}

function normalizePhone(p?: string) {
  const raw = (p ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  if (/^\d{10}$/.test(raw)) return `+57${raw}`;
  return raw;
}

function normalizeStoreName(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function loadDriverReadyMap(): DriverReadyMap {
  try {
    const raw = localStorage.getItem(READY_PICKUP_DRIVER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveDriverReadyMap(next: DriverReadyMap) {
  try {
    localStorage.setItem(READY_PICKUP_DRIVER_STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

function persistReadyPickup(
  orderId: string,
  input: {
    storeId?: string | null;
    storeName: string;
    updatedAt?: string | null;
  }
) {
  const cleanOrderId = String(orderId ?? "").trim();
  const cleanStoreName = String(input.storeName ?? "").trim();

  if (!cleanOrderId || !cleanStoreName) return;

  const map = loadDriverReadyMap();
  const prev = map[cleanOrderId]?.stores ?? [];

  const nextStores = [...prev];
  const targetStoreId = String(input.storeId ?? "").trim();
  const targetNameNorm = normalizeStoreName(cleanStoreName);

  const idx = nextStores.findIndex((item) => {
    const itemStoreId = String(item.storeId ?? "").trim();
    const itemNameNorm = normalizeStoreName(item.storeName);
    return (targetStoreId && itemStoreId === targetStoreId) || itemNameNorm === targetNameNorm;
  });

  const nextItem: ReadyPickupStoreNotice = {
    storeId: targetStoreId || null,
    storeName: cleanStoreName,
    updatedAt: input.updatedAt ?? null,
  };

  if (idx >= 0) {
    nextStores[idx] = nextItem;
  } else {
    nextStores.push(nextItem);
  }

  map[cleanOrderId] = { stores: nextStores };
  saveDriverReadyMap(map);
}

function clearReadyPickup(orderId?: string | null) {
  const clean = String(orderId ?? "").trim();
  if (!clean) return;
  const next = { ...loadDriverReadyMap() };
  delete next[clean];
  saveDriverReadyMap(next);
}

function getReadyPickupStores(
  orderId?: string | null,
  orderStores?: AvailableOrderStore[],
  apiStores?: ReadyPickupStoreNotice[]
): ReadyPickupStoreNotice[] {
  const clean = String(orderId ?? "").trim();
  if (!clean) return [];

  const persistedMap = loadDriverReadyMap();
  const localStores = Array.isArray(persistedMap[clean]?.stores) ? persistedMap[clean].stores : [];
  const fromApi = Array.isArray(apiStores) ? apiStores : [];

  const merged = [...fromApi, ...localStores];
  if (!merged.length) return [];

  const dedup: ReadyPickupStoreNotice[] = [];
  for (const item of merged) {
    const cleanName = String(item?.storeName ?? "").trim();
    if (!cleanName) continue;

    const cleanStoreId = String(item?.storeId ?? "").trim();
    const targetNameNorm = normalizeStoreName(cleanName);

    const idx = dedup.findIndex((x) => {
      const existingId = String(x?.storeId ?? "").trim();
      const existingNameNorm = normalizeStoreName(x?.storeName);
      return (cleanStoreId && existingId === cleanStoreId) || existingNameNorm === targetNameNorm;
    });

    const nextItem: ReadyPickupStoreNotice = {
      storeId: cleanStoreId || null,
      storeName: cleanName,
      updatedAt: item?.updatedAt != null ? String(item.updatedAt) : null,
    };

    if (idx >= 0) dedup[idx] = nextItem;
    else dedup.push(nextItem);
  }

  const validNames = new Set(
    (Array.isArray(orderStores) ? orderStores : [])
      .map((s) => normalizeStoreName(s.name))
      .filter(Boolean)
  );

  if (!validNames.size) return dedup;

  return dedup.filter((item) => validNames.has(normalizeStoreName(item.storeName)));
}

function extractReadyPickupStoresFromOrderLike(raw: any): ReadyPickupStoreNotice[] {
  const out: ReadyPickupStoreNotice[] = [];

  const pushOne = (input: any) => {
    const storeName = String(input?.storeName ?? input?.name ?? "").trim();
    if (!storeName) return;

    out.push({
      storeId: String(input?.storeId ?? "").trim() || null,
      storeName,
      updatedAt:
        input?.updatedAt != null
          ? String(input.updatedAt)
          : input?.readyForPickupNotifiedAt != null
            ? String(input.readyForPickupNotifiedAt)
            : input?.readyAt != null
              ? String(input.readyAt)
              : null,
    });
  };

  if (Array.isArray(raw?.readyForPickupStores)) {
    for (const item of raw.readyForPickupStores) pushOne(item);
  }

  if (Array.isArray(raw?.pickups)) {
    for (const pickup of raw.pickups) {
      const isReady =
        Boolean(pickup?.isReadyForPickup) ||
        Boolean(pickup?.readyForPickupAt) ||
        Boolean(pickup?.readyForPickupNotifiedAt);

      if (!isReady) continue;

      pushOne({
        storeId: pickup?.storeId,
        storeName: pickup?.store?.name,
        updatedAt:
          pickup?.readyForPickupAt ??
          pickup?.readyForPickupNotifiedAt ??
          raw?.readyForPickupNotifiedAt ??
          null,
      });
    }
  }

  const singleStoreName = String(raw?.readyForPickupStoreName ?? "").trim();
  const singleUpdatedAt =
    raw?.readyForPickupNotifiedAt != null ? String(raw.readyForPickupNotifiedAt) : null;

  if (singleStoreName && out.length === 0) {
    out.push({
      storeId: String(raw?.readyForPickupStoreId ?? "").trim() || null,
      storeName: singleStoreName,
      updatedAt: singleUpdatedAt,
    });
  }

  const dedup: ReadyPickupStoreNotice[] = [];
  for (const item of out) {
    const cleanStoreId = String(item?.storeId ?? "").trim();
    const cleanName = String(item?.storeName ?? "").trim();
    if (!cleanName) continue;

    const nameNorm = normalizeStoreName(cleanName);
    const idx = dedup.findIndex((x) => {
      const existingId = String(x?.storeId ?? "").trim();
      const existingNameNorm = normalizeStoreName(x?.storeName);
      return (cleanStoreId && existingId === cleanStoreId) || existingNameNorm === nameNorm;
    });

    const nextItem: ReadyPickupStoreNotice = {
      storeId: cleanStoreId || null,
      storeName: cleanName,
      updatedAt: item?.updatedAt != null ? String(item.updatedAt) : null,
    };

    if (idx >= 0) dedup[idx] = nextItem;
    else dedup.push(nextItem);
  }

  return dedup;
}

function hydrateReadyPickupStores(
  orderId: string,
  stores: AvailableOrderStore[],
  apiStores?: ReadyPickupStoreNotice[]
): ReadyPickupStoreNotice[] {
  const merged = getReadyPickupStores(orderId, stores, apiStores);
  if (merged.length) {
    for (const item of merged) {
      persistReadyPickup(orderId, item);
    }
  }
  return merged;
}

function normalizeAvailable(raw: any): AvailableOrder | null {
  if (!raw) return null;

  const orderId = String(raw?.orderId ?? raw?.id ?? "");
  if (!orderId) return null;

  const storesArr = Array.isArray(raw?.stores) ? raw.stores : [];
  const stores: AvailableOrderStore[] = storesArr
    .map((s: any) => ({
      storeId: String(s?.storeId ?? ""),
      name: String(s?.name ?? "Establecimiento"),
      phone1: String(s?.phone1 ?? ""),
      phone2: String(s?.phone2 ?? ""),
      address: String(s?.address ?? ""),
      lat: Number(s?.lat ?? 0),
      lng: Number(s?.lng ?? 0),
      sequence: Number(s?.sequence ?? 0),
    }))
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  const pickupFromObj = raw?.pickupLocation ?? raw?.origin ?? null;

    const rawPickupLocations = Array.isArray(raw?.pickupLocations)
    ? raw.pickupLocations
    : [];

  const pickupLocations: GeoPoint[] = rawPickupLocations.length
    ? rawPickupLocations
        .map((p: any) => ({
          address: String(p?.address ?? "").trim(),
          lat: Number(p?.lat ?? 0),
          lng: Number(p?.lng ?? 0),
          placeName: String(p?.placeName ?? "").trim(),
          reference: String(p?.reference ?? "").trim(),
        }))
        .filter(
          (p: GeoPoint) =>
            !!String(p.address ?? "").trim() ||
            (Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
        )
    : stores.length
      ? stores
          .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng) && !!s.address)
          .map((s) => ({
            address: s.address,
            lat: s.lat,
            lng: s.lng,
          }))
      : [
          {
            address: String(pickupFromObj?.address ?? raw?.pickupAddress ?? ""),
            lat: Number(pickupFromObj?.lat ?? raw?.pickupLat ?? 0),
            lng: Number(pickupFromObj?.lng ?? raw?.pickupLng ?? 0),
            placeName: String(pickupFromObj?.placeName ?? raw?.pickupPlaceName ?? "").trim(),
            reference: String(pickupFromObj?.reference ?? raw?.pickupReference ?? "").trim(),
          },
        ].filter(
          (p) =>
            !!String(p.address ?? "").trim() ||
            (Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
        );

  const dropoffFromObj = raw?.dropoffLocation ?? raw?.destination ?? null;

  const dropoffLocation: GeoPoint | undefined =
    dropoffFromObj && typeof dropoffFromObj === "object"
      ? {
          address: String(
            dropoffFromObj?.address ??
              raw?.customerAddress ??
              raw?.dropoffAddress ??
              ""
          ),
          lat: Number(dropoffFromObj?.lat ?? raw?.dropoffLat ?? 0),
          lng: Number(dropoffFromObj?.lng ?? raw?.dropoffLng ?? 0),
          placeName: String(
            dropoffFromObj?.placeName ??
              raw?.dropoffPlaceName ??
              ""
          ).trim(),
          reference: String(
            dropoffFromObj?.reference ??
              raw?.dropoffReference ??
              ""
          ).trim(),
        }
      : {
          address: String(raw?.customerAddress ?? raw?.dropoffAddress ?? ""),
          lat: Number(raw?.dropoffLat ?? 0),
          lng: Number(raw?.dropoffLng ?? 0),
          placeName: String(raw?.dropoffPlaceName ?? "").trim(),
          reference: String(raw?.dropoffReference ?? "").trim(),
        };

  const hasDropoff =
    dropoffLocation &&
    Number.isFinite(dropoffLocation.lat) &&
    Number.isFinite(dropoffLocation.lng);

  const computedKm = pickupLocations.length
    ? sumRouteKm(pickupLocations, hasDropoff ? dropoffLocation : undefined)
    : 0;

  const routeAddresses: string[] = [
    ...pickupLocations.map((p) => String(p.address ?? "").trim()).filter(Boolean),
    String(dropoffLocation?.address ?? "").trim(),
  ].filter(Boolean);

  const courierStops = Array.isArray(raw?.courierStops)
  ? raw.courierStops
      .slice()
      .sort((a: any, b: any) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0))
      .map((stop: any) => ({
        sequence: Number(stop?.sequence ?? 0),
        address: String(stop?.address ?? "").trim(),
        lat: Number(stop?.lat ?? 0),
        lng: Number(stop?.lng ?? 0),
        placeName: String(stop?.placeName ?? "").trim(),
        reference: String(stop?.reference ?? "").trim(),
        contactName: String(stop?.contactName ?? "").trim(),
        contactPhone: String(stop?.contactPhone ?? "").trim(),
        instructions: String(stop?.instructions ?? "").trim(),
      }))
      .filter((stop: any) => stop.address)
  : [];

  const customer = raw?.customer ?? {};
  const deliveryFee = Number(raw?.deliveryFee ?? raw?.deliveryFeeCOP ?? 0);
  const tip = Number(raw?.tip ?? raw?.tipCOP ?? 0);

  const createdAt =
    typeof raw?.createdAt === "number"
      ? raw.createdAt
      : typeof raw?.createdAt === "string"
        ? Date.parse(raw.createdAt)
        : Date.now();

  const apiReadyStores = extractReadyPickupStoresFromOrderLike(raw);

  const hydrated: AvailableOrder = {
    orderId,
    stores,
    customer: {
      id: String(customer?.id ?? raw?.customerId ?? ""),
      name: String(customer?.name ?? "Cliente"),
      nickname: String(customer?.nickname ?? ""),
      phone: String(customer?.phone ?? ""),
      email: String(customer?.email ?? ""),
    },
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    orderType: raw?.orderType ? String(raw.orderType) : null,
    courierServiceType: raw?.courierServiceType ? String(raw.courierServiceType) : null,
    deliveryFee,
    tip,
    pickupLocations,
    pickupLocation: pickupLocations[0],
    dropoffLocation: hasDropoff ? dropoffLocation : undefined,
    distanceKm: computedKm,
    routeAddresses,
    courierStops,
    customerAddress: String(dropoffLocation?.address ?? "").trim(),
    customerNote: String(raw?.customerNote ?? ""),
    packageDescription: String(raw?.packageDescription ?? "").trim(),
    status: raw?.status ? String(raw.status) : undefined,
    flowStatus: raw?.flowStatus ? String(raw.flowStatus) : undefined,
    cityId: raw?.cityId ? String(raw.cityId) : null,
    assignedAt: raw?.assignedAt ? String(raw.assignedAt) : null,
    deliveredAt: raw?.deliveredAt ? String(raw.deliveredAt) : null,
    driverLat: raw?.driverLat != null ? Number(raw.driverLat) : null,
    driverLng: raw?.driverLng != null ? Number(raw.driverLng) : null,
    driverLocationUpdatedAt: raw?.driverLocationUpdatedAt
      ? String(raw.driverLocationUpdatedAt)
      : null,
    readyForPickupStores: hydrateReadyPickupStores(orderId, stores, apiReadyStores),
  };

  return hydrated;
}

async function fetchOrderFromApi(orderId: string): Promise<AvailableOrder | null> {
  try {
    const o = await apiFetch<any>(`/orders/${orderId}`, {
  method: "GET",
  cache: "no-store",
});

    const status = String(o?.status ?? "").toUpperCase();
    const flowStatus = String(o?.flowStatus ?? "").toUpperCase();

    if (status === "CANCELLED" || flowStatus === "CANCELLED") return null;
    if (status === "DELIVERED" || flowStatus === "DELIVERED") return null;

    const driverId = o?.driverId ? String(o.driverId) : "";
    if (status === "AVAILABLE" || !driverId) return null;

    const pickups = Array.isArray(o?.pickups) ? o.pickups : [];
    const storesSorted = pickups
      .slice()
      .sort((a: any, b: any) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0));

    const stores: AvailableOrderStore[] = storesSorted.map((p: any) => ({
      storeId: String(p?.storeId ?? ""),
      name: String(p?.store?.name ?? "Establecimiento"),
      phone1: String(p?.store?.cel1 ?? ""),
      phone2: String(p?.store?.cel2 ?? ""),
      address: String(p?.pickupAddress ?? p?.store?.address ?? ""),
      lat: Number(p?.pickupLat ?? p?.store?.lat ?? 0),
      lng: Number(p?.pickupLng ?? p?.store?.lng ?? 0),
      sequence: Number(p?.sequence ?? 0),
    }));

    const pickupLocations: GeoPoint[] = stores.length
      ? stores.map((s) => ({
          address: s.address,
          lat: s.lat,
          lng: s.lng,
        }))
      : [
          {
            address: String(o?.pickupAddress ?? ""),
            lat: Number(o?.pickupLat ?? 0),
            lng: Number(o?.pickupLng ?? 0),
            placeName: String(o?.pickupPlaceName ?? "").trim(),
            reference: String(o?.pickupReference ?? "").trim(),
          },
        ].filter(
          (p) =>
            !!String(p.address ?? "").trim() ||
            (Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
        );

    const dropoffLocation: GeoPoint = {
      address: String(o?.dropoffAddress ?? ""),
      lat: Number(o?.dropoffLat ?? 0),
      lng: Number(o?.dropoffLng ?? 0),
      placeName: String(o?.dropoffPlaceName ?? "").trim(),
      reference: String(o?.dropoffReference ?? "").trim(),
    };

    const computedKm = sumRouteKm(pickupLocations, dropoffLocation);

    const deliveryFee = Number(o?.deliveryFeeCOP ?? 0);
    const tip = Number(o?.tipCOP ?? 0);

    const routeAddresses: string[] = [
      ...pickupLocations.map((p) => String(p.address ?? "").trim()).filter(Boolean),
      String(dropoffLocation?.address ?? "").trim(),
    ].filter(Boolean);

    const courierStops = Array.isArray(o?.courierStops)
  ? o.courierStops
      .slice()
      .sort((a: any, b: any) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0))
      .map((stop: any) => ({
        sequence: Number(stop?.sequence ?? 0),
        address: String(stop?.address ?? "").trim(),
        lat: Number(stop?.lat ?? 0),
        lng: Number(stop?.lng ?? 0),
        placeName: String(stop?.placeName ?? "").trim(),
        reference: String(stop?.reference ?? "").trim(),
        contactName: String(stop?.contactName ?? "").trim(),
        contactPhone: String(stop?.contactPhone ?? "").trim(),
        instructions: String(stop?.instructions ?? "").trim(),
      }))
      .filter((stop: any) => stop.address)
  : [];

    const customer = o?.customer ?? null;
    const apiReadyStores = extractReadyPickupStoresFromOrderLike(o);

    const hydrated: AvailableOrder = {
      orderId: String(o?.id ?? orderId),
      stores,
      customer: {
        id: String(o?.customerId ?? ""),
        name: String(customer?.name ?? "Cliente"),
        nickname: String(customer?.nickname ?? ""),
        phone: String(customer?.phone ?? ""),
        email: String(customer?.email ?? ""),
      },
      createdAt: new Date(String(o?.createdAt ?? new Date().toISOString())).getTime(),
      orderType: o?.orderType ? String(o.orderType) : null,
      courierServiceType: o?.courierServiceType ? String(o.courierServiceType) : null,
      deliveryFee,
      tip,
      pickupLocations,
      pickupLocation: pickupLocations[0],
      dropoffLocation,
      distanceKm: computedKm,
      routeAddresses,
      courierStops,
      customerAddress: dropoffLocation.address ?? "",
      customerNote: String(o?.customerNote ?? ""),
      packageDescription: String(o?.packageDescription ?? "").trim(),
      status,
      flowStatus,
      cityId: o?.cityId ? String(o.cityId) : null,
      assignedAt: o?.assignedAt ? String(o.assignedAt) : null,
      deliveredAt: o?.deliveredAt ? String(o.deliveredAt) : null,
      driverLat: o?.driverLat != null ? Number(o.driverLat) : null,
      driverLng: o?.driverLng != null ? Number(o.driverLng) : null,
      driverLocationUpdatedAt: o?.driverLocationUpdatedAt
        ? String(o.driverLocationUpdatedAt)
        : null,
      readyForPickupStores: hydrateReadyPickupStores(String(o?.id ?? orderId), stores, apiReadyStores),
    };

    return hydrated;
  } catch {
    return null;
  }
}

async function fetchActiveOrderForMe(): Promise<AvailableOrder | null> {
  try {
    const out = await apiFetch<DriverActiveOrderResponse>("/drivers/me/active-order", {
      method: "GET",
      cache: "no-store",
    });

    if (!out?.ok || !out?.activeOrder) return null;

    const normalized = normalizeAvailable(out.activeOrder);
    if (!normalized?.orderId) return normalized;

    const fresh = await fetchOrderFromApi(normalized.orderId);
    return fresh ?? normalized;
  } catch {
    return null;
  }
}

function stepFromApi(order: AvailableOrder, fallback: ActiveState["step"]): ActiveState["step"] {
  const status = String(order.status ?? "").toUpperCase();
  const flow = String(order.flowStatus ?? "").toUpperCase();

  if (status === "DELIVERED" || flow === "DELIVERED") return "ENTREGADO";
  if (status === "CANCELLED" || flow === "CANCELLED") return fallback;
  if (status === "EN_ROUTE" || flow === "EN_ROUTE") return "EN_RUTA";
  if (status === "ASSIGNED") return "ASIGNADO";

  return fallback;
}

export default function DriverHomePage() {
  const { citySlug, cityName, cityLabel, loading: cityLoading } = useDriverCity();

  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [termsAccepted, setTermsAccepted] = useState(false);
const [privacyAccepted, setPrivacyAccepted] = useState(false);

const [independenceAccepted, setIndependenceAccepted] = useState(false);
const [checkingIndependence, setCheckingIndependence] = useState(true);

const [checkingTerms, setCheckingTerms] = useState(true);
const [checkingPrivacy, setCheckingPrivacy] = useState(true);

  const [cancelling, setCancelling] = useState(false);

  const [assignedOrder, setAssignedOrder] = useState<AvailableOrder | null>(null);
  const [assignedStep, setAssignedStep] = useState<ActiveState["step"]>("ASIGNADO");
  const [driverIdForEvents, setDriverIdForEvents] = useState<string | null>(null);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const lastActionAtRef = useRef(0);
  const markAction = () => {
    lastActionAtRef.current = Date.now();
  };

  const [dots, setDots] = useState<"" | "." | ".." | "...">("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(Date.now());
  const [refreshingUi, setRefreshingUi] = useState(false);
  const [checkingActiveOrder, setCheckingActiveOrder] = useState(true);

  const [canOperate, setCanOperate] = useState<boolean>(true);
  const [blockedMsg, setBlockedMsg] = useState<string>("");
  const [checkingEligibility, setCheckingEligibility] = useState<boolean>(true);

  const assignedOrderRef = useRef<AvailableOrder | null>(null);
  const assignedStepRef = useRef<ActiveState["step"]>("ASIGNADO");

  const seenAvailableIdsRef = useRef<Set<string>>(new Set());
  const lastAvailRefreshNotifyAtRef = useRef<number>(0);
  const reminder30TimeoutRef = useRef<any>(null);

  const [mapSrc, setMapSrc] = useState<string>("/maps/driver-generic.png");

  useEffect(() => {
    assignedOrderRef.current = assignedOrder;
  }, [assignedOrder]);

  useEffect(() => {
    assignedStepRef.current = assignedStep;
  }, [assignedStep]);

  useEffect(() => {
    if (citySlug) {
      setMapSrc(`/maps/${citySlug}.png`);
    } else {
      setMapSrc("/maps/driver-generic.png");
    }
  }, [citySlug]);

  useEffect(() => {
  let mounted = true;

  async function checkTerms() {
    setCheckingTerms(true);

    try {
      const accepted = await checkDriverTermsStatus();

      if (!mounted) return;

      setTermsAccepted(accepted);
    } catch {
      if (!mounted) return;
      setTermsAccepted(false);
    } finally {
      if (mounted) {
        setCheckingTerms(false);
      }
    }
  }

  checkTerms();

  return () => {
    mounted = false;
  };
}, []);
useEffect(() => {
  let mounted = true;

  async function loadPrivacy() {
    setCheckingPrivacy(true);

    try {
      const accepted = await checkDriverPrivacyStatus();

      if (!mounted) return;

      setPrivacyAccepted(accepted);
    } catch {
      if (!mounted) return;

      setPrivacyAccepted(false);
    } finally {
      if (mounted) {
        setCheckingPrivacy(false);
      }
    }
  }

  loadPrivacy();

  return () => {
    mounted = false;
  };
}, []);

  useEffect(() => {
    ensureNotifyPermission();
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const me = await apiFetch<DriverMeResponse>("/drivers/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!alive) return;

        const driverId =
          String((me as any)?.userId ?? (me as any)?.id ?? "").trim() || null;

        setDriverIdForEvents(driverId);
      } catch {
        if (!alive) return;
        setDriverIdForEvents(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setDots((d) => (d === "" ? "." : d === "." ? ".." : d === ".." ? "..." : ""));
    }, 450);
    return () => clearInterval(t);
  }, []);

  const secondsSinceUpdate = useMemo(() => {
    const s = Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 1000));
    return s;
  }, [lastUpdatedAt]);

  useEffect(() => {
    const t = setInterval(() => {
      setLastUpdatedAt((v) => v);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const gpsIntervalRef = useRef<any>(null);
  const lastSentAtRef = useRef<number>(0);
  const lastSentPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const deliveredHoldRef = useRef(false);
const deliveredOrderRef = useRef<AvailableOrder | null>(null);

  const trySendGps = async (orderId: string) => {
    try {
      if (typeof window === "undefined") return;
      if (!navigator?.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = Number(pos?.coords?.latitude);
          const lng = Number(pos?.coords?.longitude);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

          const now = Date.now();
          if (now - lastSentAtRef.current < 4800) return;

          const last = lastSentPosRef.current;
          if (last) {
            const dLat = Math.abs(last.lat - lat);
            const dLng = Math.abs(last.lng - lng);
            if (dLat < 0.00005 && dLng < 0.00005) {
              lastSentAtRef.current = now;
              return;
            }
          }

          lastSentAtRef.current = now;
          lastSentPosRef.current = { lat, lng };

          await driverReportLocation(orderId, lat, lng);
        },
        () => {},
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 6000,
        }
      );
    } catch {}
  };

  useEffect(() => {
    if (gpsIntervalRef.current) {
      clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
    }

    if (!assignedOrder?.orderId) return;
    if (assignedStep === "ENTREGADO") return;

    trySendGps(assignedOrder.orderId);

    gpsIntervalRef.current = setInterval(() => {
      if (!assignedOrder?.orderId) return;
      trySendGps(assignedOrder.orderId);
    }, 5000);

    return () => {
      if (gpsIntervalRef.current) {
        clearInterval(gpsIntervalRef.current);
        gpsIntervalRef.current = null;
      }
    };
  }, [assignedOrder?.orderId, assignedStep]);

  
const setStep = (step: ActiveState["step"]) => {
  assignedStepRef.current = step;
  setAssignedStep(step);
};

const syncActiveOrderFromBackend = useCallback(async () => {
  setCheckingActiveOrder(true);

  try {
    const activeFromBackend = await fetchActiveOrderForMe();

    if (!activeFromBackend?.orderId) {
      assignedOrderRef.current = null;
      setAssignedOrder(null);
      setAssignedStep("ASIGNADO");
      return null;
    }

    const backendStep = stepFromApi(activeFromBackend, assignedStepRef.current);
const safeStep = maxStep(assignedStepRef.current, backendStep);

    assignedOrderRef.current = activeFromBackend;
    assignedStepRef.current = safeStep;

    setOrders([]);
    setSelectedId(null);
    setAssignedOrder(activeFromBackend);
    setAssignedStep(safeStep);

    return activeFromBackend;
  } finally {
    setCheckingActiveOrder(false);
  }
}, []);

const assignAndPersist = (o: AvailableOrder) => {
  assignedOrderRef.current = o;
  setOrders([]);
  setSelectedId(null);
  setAssignedOrder(o);
  setAssignedStep("ASIGNADO");
};

useEffect(() => {
  let alive = true;

  (async () => {
    await syncActiveOrderFromBackend();
    if (!alive) return;
  })();

  return () => {
    alive = false;
  };
}, [syncActiveOrderFromBackend]);

useEffect(() => {
  const handleReturnToApp = () => {
    if (document.visibilityState === "visible") {
      syncActiveOrderFromBackend();
    }
  };

  window.addEventListener("focus", syncActiveOrderFromBackend);
  document.addEventListener("visibilitychange", handleReturnToApp);

  return () => {
    window.removeEventListener("focus", syncActiveOrderFromBackend);
    document.removeEventListener("visibilitychange", handleReturnToApp);
  };
}, [syncActiveOrderFromBackend]);








  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setCheckingEligibility(true);
        setBlockedMsg("");

        const el = await apiFetch("/drivers/me/eligibility", { method: "GET", cache: "no-store" });

        const can = Boolean((el as any)?.canOperate);
        const reasons = Array.isArray((el as any)?.reasons) ? ((el as any).reasons as string[]) : [];

        if (!alive) return;

        if (!can) {
          setCanOperate(false);

          const first = reasons?.[0] ? String(reasons[0]) : "NO_AUTORIZADO";
          const msg =
            first === "PERFIL_INACTIVO"
              ? "Tu cuenta está inactiva por decisión de Operación/Administración. No puedes ponerte En línea ni aceptar pedidos."
              : first === "MANUAL_BLOCKED"
                ? "Tu cuenta está bloqueada manualmente por Operación/Administración. Contacta soporte."
                : first === "MANUAL_PENDING"
                  ? "Tu cuenta está en verificación manual (PENDING). Por ahora no puedes operar."
                  : first === "DOCS_VENCIDOS_O_FALTAN" || first === "VEHICULO_INACTIVO"
                    ? "Tu documentación del vehículo está vencida o el vehículo está inactivo. No puedes operar hasta actualizar/verificar SOAT y Tecnomecánica."
                    : "No puedes operar en este momento. Revisa tu perfil/vehículo o contacta soporte.";

          setBlockedMsg(msg);
          setOrders([]);
          setLastUpdatedAt(Date.now());
          return;
        }

        setCanOperate(true);
        setBlockedMsg("");
      } catch {
        if (!alive) return;
        setCanOperate(true);
        setBlockedMsg("");
      } finally {
        if (alive) setCheckingEligibility(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  
  const loadAvailableOrders = useCallback(async () => {
  if (!canOperate) {
    setOrders([]);
    setLastUpdatedAt(Date.now());
    return;
  }

  const active = await fetchActiveOrderForMe();

  if (active?.orderId) {
    const backendStep = stepFromApi(active, assignedStepRef.current);

    setAssignedOrder(active);
    assignedOrderRef.current = active;

    const safeStep = maxStep(assignedStepRef.current, backendStep);

setAssignedStep(safeStep);
assignedStepRef.current = safeStep;

    setOrders([]);
    setSelectedId(null);
    setLastUpdatedAt(Date.now());
    return;
  }

  try {
    const arr = await driverFetchAvailableOrders();
    const normalized = (Array.isArray(arr) ? arr : [])
      .map((o) => normalizeAvailable(o))
      .filter(Boolean) as AvailableOrder[];

    normalized.sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));

    try {
      let newCount = 0;
      const seen = seenAvailableIdsRef.current;

      for (const o of normalized) {
        const id = String(o?.orderId ?? "").trim();
        if (!id) continue;

        const status = String(o?.status ?? "").toUpperCase();
        const flow = String(o?.flowStatus ?? "").toUpperCase();

        const isAvailable = status === "AVAILABLE" || flow === "AVAILABLE";
        if (!isAvailable) continue;

        if (seen.has(id)) continue;

        newCount++;
        seen.add(id);
      }

      if (newCount > 0 && !assignedOrderRef.current) {
        playDriverSound("NEW_AVAILABLE", 2000);
        showNotify("Nuevo pedido disponible", `Tienes ${newCount} pedido(s) nuevo(s) para tomar.`);
        lastAvailRefreshNotifyAtRef.current = Date.now();
      }
    } catch {}

    setOrders(normalized);
    setLastUpdatedAt(Date.now());
  } catch {
    setLastUpdatedAt(Date.now());
  }
}, [canOperate]);

  useEffect(() => {
    if (assignedOrder) return;
    if (!canOperate) return;

    let alive = true;
    let es: EventSource | null = null;

    (async () => {
      await loadAvailableOrders();
      if (!alive) return;

      const url = `${API_BASE}/events/stream?driversAvailable=1`;
      es = new EventSource(url, { withCredentials: true });

      es.onmessage = () => {
        loadAvailableOrders();
      };

      es.onerror = () => {};
    })();

    return () => {
      alive = false;
      try {
        es?.close();
      } catch {}
    };
  }, [assignedOrder, loadAvailableOrders, canOperate]);

  useEffect(() => {
    if (!canOperate) return;

    const t = window.setInterval(() => {
      if (assignedOrderRef.current) return;
      if (!orders || orders.length === 0) return;

      const now = Date.now();
      const last = lastAvailRefreshNotifyAtRef.current || 0;

      if (now - last >= 5 * 60 * 1000) {
        lastAvailRefreshNotifyAtRef.current = now;

        playDriverSound("NEW_AVAILABLE", 2000);
        showNotify("Pedidos disponibles", "Aún hay pedidos disponibles. Revisa y acepta uno si puedes.");
      }
    }, 25_000);

    return () => window.clearInterval(t);
  }, [orders, canOperate]);

  useEffect(() => {
    if (reminder30TimeoutRef.current) {
      clearTimeout(reminder30TimeoutRef.current);
      reminder30TimeoutRef.current = null;
    }

    if (!assignedOrder?.orderId) return;
    if (assignedStep === "ENTREGADO") return;

    const orderId = assignedOrder.orderId;

    reminder30TimeoutRef.current = setTimeout(() => {
      const current = assignedOrderRef.current;
      if (!current?.orderId) return;
      if (current.orderId !== orderId) return;

      const step = assignedStepRef.current;
      if (step === "ENTREGADO") return;

      playDriverSound("GENERIC", 4000);
      showNotify("Recordatorio", "Ya han pasado 30 minutos desde que inició este servicio.");
    }, 30 * 60 * 1000);

    return () => {
      if (reminder30TimeoutRef.current) {
        clearTimeout(reminder30TimeoutRef.current);
        reminder30TimeoutRef.current = null;
      }
    };
  }, [assignedOrder?.orderId, assignedStep]);

  useEffect(() => {
    if (!driverIdForEvents) return;

    const url = `${API_BASE}/events/stream?driverId=${encodeURIComponent(driverIdForEvents)}`;
    const es = new EventSource(url, { withCredentials: true });

    es.onmessage = async (event) => {
      try {
        const raw = String(event?.data ?? "").trim();
        if (!raw) return;

        const parsed = JSON.parse(raw) as any;
        const type = String(parsed?.type ?? "").trim();

        if (type !== "driver.order.ready_for_pickup") return;

        const orderId = String(parsed?.orderId ?? "").trim();
        if (!orderId) return;

        const storeId = String(parsed?.payload?.storeId ?? "").trim() || null;
        const storeName =
          String(parsed?.payload?.storeName ?? "").trim() || "Tu pedido";
        const updatedAt =
          parsed?.payload?.updatedAt != null ? String(parsed.payload.updatedAt) : null;

        persistReadyPickup(orderId, {
          storeId,
          storeName,
          updatedAt,
        });

        playDriverSound("PICKUP", 1800);
showNotify("Pedido listo para recoger", `${storeName} ya tiene el pedido listo.`);

        const current = assignedOrderRef.current;
        if (current?.orderId && current.orderId === orderId) {
          const fresh = await fetchOrderFromApi(orderId);
          if (fresh) {
            setAssignedOrder(fresh);
            assignedOrderRef.current = fresh;
          } else {
            setAssignedOrder((prev) =>
              prev?.orderId === orderId
                ? {
                    ...prev,
                    readyForPickupStores: getReadyPickupStores(orderId, prev.stores),
                  }
                : prev
            );
          }
        }
      } catch {}
    };

    es.onerror = () => {};

    return () => {
      try {
        es.close();
      } catch {}
    };
  }, [driverIdForEvents]);

useEffect(() => {
  let mounted = true;

  async function loadIndependence() {
    setCheckingIndependence(true);

    try {
      const accepted = await checkDriverIndependenceStatus();

      if (!mounted) return;

      setIndependenceAccepted(accepted);
    } catch {
      if (!mounted) return;

      setIndependenceAccepted(false);
    } finally {
      if (mounted) {
        setCheckingIndependence(false);
      }
    }
  }

  loadIndependence();

  return () => {
    mounted = false;
  };
}, []);

  useSse({
    enabled: !!assignedOrder?.orderId && assignedStep !== "ENTREGADO",
    url: assignedOrder?.orderId
      ? `${API_BASE}/events/stream?orderId=${encodeURIComponent(assignedOrder.orderId)}`
      : null,
    onMessage: async (ev) => {
  try {
    const raw = String(ev?.data ?? "").trim();
    if (raw) {
      const parsed = JSON.parse(raw);
      const type = String(parsed?.type ?? "").trim();

      if (type === "ping") return;

      if (type && type !== "order.updated" && type !== "driver.order.ready_for_pickup") {
        return;
      }
    }
  } catch {
    return;
  }
      if (!assignedOrder?.orderId) return;
      if (assignedStep === "ENTREGADO" || deliveredHoldRef.current) return;
      if (Date.now() - lastActionAtRef.current < 1400) return;

      const fresh = await fetchOrderFromApi(assignedOrder.orderId);

      if (!fresh) {
  if (deliveredHoldRef.current) {
    setStep("ENTREGADO");
    return;
  }

  clearReadyPickup(assignedOrder.orderId);
  setAssignedOrder(null);
  setAssignedStep("ASIGNADO");
  return;
}

      const currentStep = assignedStepRef.current;
const apiStep = stepFromApi(fresh, currentStep);
const nextStep = maxStep(currentStep, apiStep);

// 🔊 Sonidos por transición de estado
if (nextStep !== currentStep) {
  if (nextStep === "EN_RUTA") {
    playDriverSound("EN_ROUTE", 1800);
    showNotify(
      "Servicio en ruta",
      "El servicio ahora está en ruta."
    );
  }

  if (nextStep === "ENTREGADO") {
    playDriverSound("DELIVERED", 1800);
    showNotify(
      "Servicio entregado",
      "El pedido fue entregado correctamente."
    );
  }
}

const freshStatus = String(fresh?.status ?? "").toUpperCase();
const freshFlow = String(fresh?.flowStatus ?? "").toUpperCase();

if (
  freshStatus === "CANCELLED" ||
  freshFlow === "CANCELLED"
) {
  playDriverSound("CANCELLED", 1800);

  showNotify(
    "Servicio cancelado",
    "El servicio fue cancelado."
  );
}

setAssignedOrder(fresh);
assignedOrderRef.current = fresh;

assignedStepRef.current = nextStep;
setAssignedStep(nextStep);
    },
  });

  const visibleOrders = useMemo(() => orders, [orders]);

  const displayCity = cityLabel || cityName || "tu ciudad operativa";
  const cityShort = cityName || "tu ciudad";

  const readyPickupStores =
    assignedOrder?.orderId
      ? assignedOrder.readyForPickupStores ?? getReadyPickupStores(assignedOrder.orderId, assignedOrder.stores)
      : [];

  const readyPickupStoreNames = readyPickupStores.map((s) => s.storeName).filter(Boolean);

  if (assignedOrder) {
    const storesSorted = (assignedOrder.stores ?? [])
      .slice()
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    const storeName = storesSorted.length ? storesSorted.map((s) => s.name).join(" · ") : "Pedido";
    const payout = Number(assignedOrder.deliveryFee ?? 0) + Number(assignedOrder.tip ?? 0);

    const pickups: GeoPoint[] =
      Array.isArray(assignedOrder.pickupLocations) && assignedOrder.pickupLocations.length
        ? assignedOrder.pickupLocations
        : (assignedOrder as any).pickupLocation
          ? [((assignedOrder as any).pickupLocation as GeoPoint)]
          : assignedOrder.pickupLocation
            ? [assignedOrder.pickupLocation]
            : [];

    const dropoffLocation: GeoPoint = (assignedOrder as any).dropoffLocation ?? { lat: 0, lng: 0 };

    const storesContacts = storesSorted.map((s) => ({
      name: s.name,
      phone1: normalizePhone(s.phone1),
      phone2: normalizePhone(s.phone2),
    }));

    const customerName =
      assignedOrder.customer?.nickname?.trim()
        ? assignedOrder.customer.nickname
        : assignedOrder.customer?.name ?? "Cliente";

    const customerPhone = normalizePhone(assignedOrder.customer?.phone);

        const orderDTO: DriverOrder = {
      orderId: assignedOrder.orderId,
      storeName,
      courierServiceType: assignedOrder.courierServiceType ?? null,
      distanceKm: Number(assignedOrder.distanceKm ?? 0),
      payout,
      packageDescription: String((assignedOrder as any)?.packageDescription ?? "").trim(),
      routeAddresses: Array.isArray((assignedOrder as any)?.routeAddresses)
  ? (assignedOrder as any).routeAddresses
  : [],

courierStops: Array.isArray((assignedOrder as any)?.courierStops)
  ? (assignedOrder as any).courierStops
  : [],
      pickupLocations: pickups.map((p: any, idx) => ({
        lat: Number(p?.lat ?? 0),
        lng: Number(p?.lng ?? 0),
        address: String(p?.address ?? "").trim(),
        placeName: String(
          p?.placeName ??
            (idx === 0 ? (assignedOrder as any)?.pickupLocation?.placeName : "") ??
            ""
        ).trim(),
        reference: String(
          p?.reference ??
            (idx === 0 ? (assignedOrder as any)?.pickupLocation?.reference : "") ??
            ""
        ).trim(),
      })),
      dropoffLocation: {
        lat: Number((dropoffLocation as any)?.lat ?? 0),
        lng: Number((dropoffLocation as any)?.lng ?? 0),
        address: String((dropoffLocation as any)?.address ?? "").trim(),
        placeName: String((dropoffLocation as any)?.placeName ?? "").trim(),
        reference: String((dropoffLocation as any)?.reference ?? "").trim(),
      },
      customerNote: assignedOrder.customerNote ?? "",
      status: assignedOrder.status,
      flowStatus: assignedOrder.flowStatus,
      customerName,
      customerPhone,
      storesContacts,
    };

    if (assignedStep === "ENTREGADO") {
      return (
        <DeliveredOrderCard
          order={{
  orderId: orderDTO.orderId,
  storeName: orderDTO.storeName,
  payout: orderDTO.payout,
  courierServiceType: orderDTO.courierServiceType,
}}
          onBackToOrders={() => {
            deliveredHoldRef.current = false;

            addDriverHistoryItem({
              id: assignedOrder.orderId,
              storeName,
              payoutCOP: payout,
              deliveredAtISO: new Date().toISOString(),
              status: "DELIVERED",
            });

            clearReadyPickup(assignedOrder.orderId);
            setAssignedOrder(null);
            setAssignedStep("ASIGNADO");
            setSelectedId(null);
          }}
        />
      );
    }

    if (assignedStep === "EN_RUTA") {
      return (
        <EnRouteOrderCard
          order={orderDTO}
          onDelivered={async () => {
  markAction();
  deliveredHoldRef.current = true;
  deliveredOrderRef.current = assignedOrder;

  clearReadyPickup(assignedOrder.orderId);
  setStep("ENTREGADO");
}}
        />
      );
    }

    if (assignedStep === "EN_CAMINO") {
      return (
                <PickupOrderCard
          order={orderDTO}
          readyPickupStoreNames={readyPickupStoreNames}
          onPickedUp={async () => {
  markAction();

  const r = await driverUpdateOrderStatus(assignedOrder.orderId, "EN_ROUTE");

  if (!r.ok) {
    throw new Error("No se pudo pasar el pedido a En Ruta.");
  }

  setStep("EN_RUTA");
}}
        />
      );
    }

    return (
      <AssignedOrderCard
        order={orderDTO}
        readyPickupStoreNames={readyPickupStoreNames}
        onArrived={async () => {
  markAction();

  const r = await driverUpdateOrderStatus(
    assignedOrder.orderId,
    "ASSIGNED"
  );

  if (!r.ok) {
    throw new Error("No se pudo reportar llegada.");
  }

  setStep("EN_CAMINO");
}}
        cancelling={cancelling}
        onCancel={async () => {
          if (cancelling) return;
          setCancelling(true);
          markAction();

          const res = await driverReleaseOrder(assignedOrder.orderId);

          addDriverHistoryItem({
            id: assignedOrder.orderId,
            storeName,
            payoutCOP: payout,
            deliveredAtISO: new Date().toISOString(),
            status: "CANCELLED",
          });

          if (!res.ok) {
            // opcional
          }

          clearReadyPickup(assignedOrder.orderId);
          setAssignedOrder(null);
          setAssignedStep("ASIGNADO");
          setSelectedId(null);
          setCancelling(false);
        }}
      />
    );
  }

  const empty = visibleOrders.length === 0;

if (
  !checkingTerms &&
  !checkingPrivacy &&
  !checkingIndependence &&
  (!termsAccepted || !privacyAccepted || !independenceAccepted)
) {
  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto flex min-h-[76vh] w-full max-w-md flex-col justify-center px-3 py-4">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg">
          <div className="px-5 pb-5 pt-5">
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-black text-slate-950">
                Actualización legal requerida
              </h1>
              <p className="mt-2 text-[13px] font-medium leading-5 text-slate-600">
                Para continuar operando en KroniX debes revisar y aceptar los documentos legales vigentes.
              </p>

              <div className="mt-4 grid gap-2">
                {!termsAccepted && (
                  <a
                    href="/profile/terms"
                    className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white text-center"
                  >
                    Revisar Términos y Condiciones
                  </a>
                )}

                {!privacyAccepted && termsAccepted && (
                  <a
                    href="/profile/privacy"
                    className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white text-center"
                  >
                    Revisar Política de Privacidad
                  </a>
                )}

                {!independenceAccepted && termsAccepted && privacyAccepted && (
                  <a
                    href="/profile/independence"
                    className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white text-center"
                  >
                    Revisar Acuerdo de Independencia
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="w-full bg-white p-0">
      {!checkingEligibility &&
!checkingTerms &&
!checkingPrivacy &&
!canOperate ? (
        <div className="mx-auto w-full max-w-md px-4 pt-4">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-9 w-9 shrink-0 rounded-2xl bg-amber-200/60 flex items-center justify-center">
                <span className="text-amber-900 text-lg">⚠️</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-amber-900">Cuenta temporalmente inactiva</div>
                <div className="mt-1 text-[12px] leading-5 text-amber-900/90">
                  {blockedMsg || "No puedes ponerte En línea ni aceptar pedidos en este momento."}
                </div>

                <div className="mt-3 flex gap-2">
                  <a
                    href="/profile/cars"
                    className="inline-flex items-center justify-center rounded-2xl bg-amber-900 px-4 py-2 text-[12px] font-extrabold text-white hover:bg-amber-950"
                  >
                    Ver Vehículos
                  </a>
                  <a
                    href="/profile/support"
                    className="inline-flex items-center justify-center rounded-2xl border border-amber-300 bg-white px-4 py-2 text-[12px] font-extrabold text-amber-900 hover:bg-amber-100"
                  >
                    Contactar soporte
                  </a>
                </div>

                <div className="mt-2 text-[11px] text-amber-900/80">
                  Consejo: mantén SOAT y Tecnomecánica vigentes para evitar suspensión automática.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {empty ? (
        <div className="w-full rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="relative px-6 pt-8 pb-34 text-white bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-extrabold leading-tight">Buscando pedidos{dots}</div>
                <div className="mt-2 text-sm text-white/90">
                  {cityLoading
                    ? "Cargando tu ciudad operativa..."
                    : `Estamos escaneando comercios cercanos en ${cityShort} para asignarte una orden.`}
                </div>
              </div>

              <div className="shrink-0">
                <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-white/90">
              <span className="inline-block h-2 w-2 rounded-full bg-white/90 animate-pulse" />
              Última actualización: hace {secondsSinceUpdate}s
            </div>
          </div>

          <div className="relative z-20 px-4 pb-4 -mt-28">
            <div className="rounded-3xl bg-white p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">Radar de búsqueda</div>
                  <div className="mt-1 text-sm font-extrabold text-gray-900">
                    {cityLoading ? "Cargando ciudad..." : displayCity}
                  </div>
                </div>

                <div className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
                  Driver
                </div>
              </div>

              <div className="mt-4 relative h-50 w-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <Image
                  src={mapSrc}
                  alt={cityLoading ? "Mapa de ciudad" : `Mapa ${displayCity}`}
                  fill
                  className="object-cover contrast-125 saturate-125 brightness-95"
                  priority
                  onError={() => setMapSrc("/maps/driver-generic.png")}
                />
                <div className="absolute inset-0 bg-white/4" />
                <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/25 animate-ping h-24 w-24" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/20 animate-ping [animation-delay:0.6s] h-44 w-44" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/15 animate-ping [animation-delay:1.2s] h-64 w-64" />

                <div className="absolute left-[28%] top-[40%] h-2 w-2 rounded-full bg-blue-600/80 animate-pulse" />
                <div className="absolute left-[70%] top-[62%] h-2 w-2 rounded-full bg-blue-600/70 animate-pulse" />
                <div className="absolute left-[55%] top-[28%] h-2 w-2 rounded-full bg-blue-600/60 animate-pulse" />

                <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white px-8 py-1 text-[11px] font-extrabold text-gray-700 shadow-sm border border-gray-200">
                  🛵 <span>{cityLoading ? "Patrullando zona" : `Patrullando ${cityShort}`}</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-slate-50 z-0 pointer-events-none" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-gray-600">Estado</div>
                  <div className="mt-1 text-sm font-extrabold text-emerald-700">En búsqueda</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-[11px] font-bold text-gray-600">Ciudad</div>
                  <div className="mt-1 text-sm font-extrabold text-gray-800 truncate">
                    {cityLoading ? "Cargando..." : cityShort}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!canOperate) return;
                  if (refreshingUi) return;
                  setRefreshingUi(true);
                  try {
                    await loadAvailableOrders();
                  } finally {
                    setRefreshingUi(false);
                  }
                }}
                className={[
                  "mt-5 w-full rounded-2xl py-3 text-sm font-extrabold text-white transition-all duration-200",
                  "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]",
                  refreshingUi || !canOperate ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {refreshingUi ? "Actualizando…" : "REINTENTAR"}
              </button>

              <div className="mt-3 text-center text-[11px] text-gray-500">
                Si aparece un pedido en {cityShort}, se mostrará aquí automáticamente.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold">Pedidos disponibles</h1>
              <div className="mt-1 text-[11px] text-gray-500">
                {cityLoading ? "Cargando ciudad..." : `Operando en ${displayCity}`}
              </div>
            </div>
            <span className="text-xs text-gray-500">{orders.length} pedidos</span>
          </div>

          <div className="mt-4 space-y-3">
            {visibleOrders.map((o) => (
              <AvailableOrderCard
                key={o.orderId}
                order={o as any}
                expanded={selectedId === o.orderId}
                onToggle={() => setSelectedId((prev) => (prev === o.orderId ? null : o.orderId))}
                accepting={acceptingId === o.orderId}
                onAccept={async () => {
  if (!canOperate) return;

  setAcceptingId(o.orderId);
  markAction();

  const res = await driverAssignOrder(o.orderId);

  if (res.ok) {
    playDriverSound("ASSIGNED", 1500);
    showNotify("Pedido asignado", "Ya tienes un pedido asignado. Revisa el detalle.");

    document.getElementById("driver-scroll-container")?.scrollTo({
  top: 0,
  behavior: "instant" as ScrollBehavior,
});

    assignAndPersist(o);
    setSelectedId(null);

    setTimeout(() => {
  document.getElementById("driver-scroll-container")?.scrollTo({
    top: 0,
    behavior: "instant" as ScrollBehavior,
  });
}, 0);
  }

  setAcceptingId(null);
}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}