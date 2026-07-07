// app/(driver)/lib/types.ts
export type GeoPoint = {
  lat: number;
  lng: number;
  address?: string;
  placeName?: string;
  reference?: string;
};

export type StoreContact = {
  name: string;
  phone1?: string;
  phone2?: string;
};

export type DriverStore = {
  storeId: string;
  name: string;
  image?: string;
};

export type DriverOrder = {
  orderId: string;

  stores?: DriverStore[];
  storeName?: string;
  serviceType?: "STORE" | "DELIVERY" | "PACKAGE" | "TAXI" | "MOTORCARGO" | string | null;
  requiredWorkerType?: "MOTORCYCLE" | "TAXI" | "MOTORCARGO" | string | null;
  workerCommissionCOP?: number | null;
  courierServiceType?: "PICKUP_AND_DELIVERY" | "SEND_PACKAGE" | "ERRAND" | string | null;

  distanceKm: number;

  deliveryFee?: number;
  tip?: number;
  payout?: number;

  pickupLocations: GeoPoint[];
  dropoffLocation: GeoPoint;

  routeAddresses?: string[];
  
  courierStops?: {
  sequence: number;
  address: string;
  lat: number;
  lng: number;
  placeName?: string;
  reference?: string;
  contactName?: string;
  contactPhone?: string;
  instructions?: string;
}[];

  customerAddress?: string;
  customerNote?: string;

  customerName?: string;
  customerPhone?: string;

  storesContacts?: StoreContact[];

  status?: string;
  flowStatus?: string;

  packageDescription?: string;
};

export type OrderUpdatedEvent = {
  type: "order.updated";
  payload: {
    id: string;
    status?: string;
    flowStatus?: string;
    updatedAt?: string;
  };
};