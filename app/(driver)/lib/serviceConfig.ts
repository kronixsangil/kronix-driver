//app\(driver)\lib\serviceConfig.ts
import type { DriverOrder } from "./types";

export type KronixServiceType =
  | "STORE"
  | "DELIVERY"
  | "PACKAGE"
  | "TAXI"
  | "MOTORCARGO"
  | "ERRAND"
  | "UNKNOWN";

export type KronixServiceConfig = {
  serviceType: KronixServiceType;
  label: string;
  shortLabel: string;
  workerLabel: string;
  workerPluralLabel: string;
  assetSlug: string;
  imageAlt: string;
  tone: string;
  heroTone: string;
  panelTone: string;
};

type AvailableImageTuning = {
  imageWrap: string;
  imageClassName: string;
};

/**
 * Ajustes visuales de las imágenes en las tarjetas disponibles.
 *
 * Para mover una imagen:
 * - scale-[1.25]       = tamaño
 * - translate-x-[4px]  = mover derecha/izquierda
 * - translate-y-[3px]  = mover abajo/arriba
 *
 * Estos valores quedan centralizados para que cuando los servicios vengan
 * desde CTCC podamos migrarlos fácilmente a una configuración dinámica.
 */
export const AVAILABLE_SERVICE_IMAGE_TUNING: Record<KronixServiceType, AvailableImageTuning> = {
  STORE: {
    imageWrap: "h-[72px] w-[92px]",
    imageClassName: "object-contain scale-[1.5] translate-x-[10px] translate-y-[2px]",
  },
  DELIVERY: {
    imageWrap: "h-[74px] w-[104px]",
    imageClassName: "object-contain scale-[1.25] translate-x-[4px] translate-y-[3px]",
  },
  PACKAGE: {
    imageWrap: "h-[74px] w-[104px]",
    imageClassName: "object-contain scale-[1.25] translate-x-[4px] translate-y-[3px]",
  },
  TAXI: {
    imageWrap: "h-[74px] w-[104px]",
    imageClassName: "object-contain scale-[1.18] translate-x-[2px] translate-y-[4px]",
  },
  MOTORCARGO: {
    imageWrap: "h-[74px] w-[104px]",
    imageClassName: "object-contain scale-[1.16] translate-x-[2px] translate-y-[4px]",
  },
  ERRAND: {
    imageWrap: "h-[74px] w-[104px]",
    imageClassName: "object-contain scale-[1.25] translate-x-[4px] translate-y-[3px]",
  },
  UNKNOWN: {
    imageWrap: "h-[74px] w-[104px]",
    imageClassName: "object-contain scale-[1.25] translate-x-[4px] translate-y-[3px]",
  },
};

const SERVICE_CONFIGS: Record<KronixServiceType, KronixServiceConfig> = {
  STORE: {
    serviceType: "STORE",
    label: "Tienda en línea",
    shortLabel: "Tienda",
    workerLabel: "Domiciliario",
    workerPluralLabel: "Domiciliarios",
    assetSlug: "store",
    imageAlt: "Tienda en línea",
    tone: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    heroTone: "from-blue-50 via-white to-emerald-50",
    panelTone: "from-blue-50/60 via-white to-emerald-50/60",
  },
  DELIVERY: {
    serviceType: "DELIVERY",
    label: "Domicilio Express",
    shortLabel: "Domi Express",
    workerLabel: "Domiciliario",
    workerPluralLabel: "Domiciliarios",
    assetSlug: "delivery",
    imageAlt: "Domicilio Express",
    tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    heroTone: "from-emerald-50 via-white to-cyan-50",
    panelTone: "from-emerald-50/60 via-white to-cyan-50/60",
  },
  PACKAGE: {
    serviceType: "PACKAGE",
    label: "KroniX Envíos",
    shortLabel: "KroniX Envíos",
    workerLabel: "Domiciliario",
    workerPluralLabel: "Domiciliarios",
    assetSlug: "package",
    imageAlt: "KroniX Envíos",
    tone: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
    heroTone: "from-cyan-50 via-white to-sky-50",
    panelTone: "from-cyan-50/60 via-white to-sky-50/60",
  },
  TAXI: {
    serviceType: "TAXI",
    label: "Taxi",
    shortLabel: "Taxi",
    workerLabel: "Taxista",
    workerPluralLabel: "Taxistas",
    assetSlug: "taxi",
    imageAlt: "Taxi",
    tone: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    heroTone: "from-amber-50 via-white to-sky-50",
    panelTone: "from-amber-50/70 via-white to-sky-50/60",
  },
  MOTORCARGO: {
    serviceType: "MOTORCARGO",
    label: "Motocarga",
    shortLabel: "Motocarga",
    workerLabel: "Motocarguero",
    workerPluralLabel: "Motocargueros",
    assetSlug: "motocarga",
    imageAlt: "Motocarga",
    tone: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    heroTone: "from-violet-50 via-white to-emerald-50",
    panelTone: "from-violet-50/70 via-white to-emerald-50/60",
  },
  ERRAND: {
    serviceType: "ERRAND",
    label: "Diligencia",
    shortLabel: "Diligencia",
    workerLabel: "Domiciliario",
    workerPluralLabel: "Domiciliarios",
    assetSlug: "delivery",
    imageAlt: "Diligencia",
    tone: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    heroTone: "from-violet-50 via-white to-emerald-50",
    panelTone: "from-violet-50/60 via-white to-emerald-50/60",
  },
  UNKNOWN: {
    serviceType: "UNKNOWN",
    label: "Servicio KroniX",
    shortLabel: "Servicio",
    workerLabel: "Worker",
    workerPluralLabel: "Workers",
    assetSlug: "delivery",
    imageAlt: "Servicio KroniX",
    tone: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
    heroTone: "from-slate-50 via-white to-slate-100",
    panelTone: "from-slate-50/60 via-white to-slate-100/60",
  },
};

export function normalizeName(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeKey(value?: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function normalizeText(value?: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchServiceKey(value?: unknown): KronixServiceType | null {
  const key = normalizeKey(value);
  if (!key) return null;

  if (
    key === "STORE" ||
    key === "SHOP" ||
    key === "ONLINE_STORE" ||
    key === "STORE_ORDER" ||
    key === "TIENDA" ||
    key === "TIENDA_EN_LINEA"
  ) {
    return "STORE";
  }

  if (
    key === "DELIVERY" ||
    key === "DOMICILIO" ||
    key === "DOMICILIO_EXPRESS" ||
    key === "DOMI_EXPRESS" ||
    key === "PICKUP_AND_DELIVERY" ||
    key === "PICKUP_DELIVERY"
  ) {
    return "DELIVERY";
  }

  if (
    key === "PACKAGE" ||
    key === "SEND_PACKAGE" ||
    key === "KRONIX_ENVIOS" ||
    key === "KRONIX_ENVIOS_PACKAGE" ||
    key === "ENVIAR" ||
    key === "ENVIAR_PAQUETE" ||
    key === "PAQUETE"
  ) {
    return "PACKAGE";
  }

  if (
    key === "TAXI" ||
    key === "CAB" ||
    key === "TAXI_SERVICE" ||
    key === "PIDE_TAXI" ||
    key === "PIDE_UN_TAXI"
  ) {
    return "TAXI";
  }

  if (
    key === "MOTORCARGO" ||
    key === "MOTOR_CARGO" ||
    key === "MOTOCARGA" ||
    key === "MOTO_CARGA" ||
    key === "MOTORCARGO_SERVICE" ||
    key === "MOTOR_CARGO_SERVICE" ||
    key === "MOTOCARGA_SERVICE" ||
    key === "MOTO_CARGO_SERVICE" ||
    key === "MOTOCARGUERO" ||
    key === "MOTO_CARGUERO"
  ) {
    return "MOTORCARGO";
  }

  if (key === "ERRAND" || key === "DILIGENCIA" || key === "DILIGENCIAS") return "ERRAND";

  return null;
}

function matchServiceText(value?: unknown): KronixServiceType | null {
  const text = normalizeText(value);
  if (!text) return null;

  if (text.includes("tienda en linea") || text.includes("tienda") || text.includes("store")) return "STORE";

  if (
    text.includes("domicilio express") ||
    text.includes("domi express") ||
    text.includes("domiciliario") ||
    text.includes("recoger comprar llevar")
  ) {
    return "DELIVERY";
  }

  if (
    text.includes("kronix envios") ||
    text.includes("enviar paquete") ||
    text.includes("send package") ||
    text.includes("paquete")
  ) {
    return "PACKAGE";
  }

  if (
    text.includes("taxi") ||
    text.includes("taxista") ||
    text.includes("pide un taxi") ||
    text.includes("pide taxi")
  ) {
    return "TAXI";
  }

  if (
    text.includes("motocarga") ||
    text.includes("moto carga") ||
    text.includes("motocarguero") ||
    text.includes("moto carguero") ||
    text.includes("motorcargo")
  ) {
    return "MOTORCARGO";
  }

  if (text.includes("diligencia")) return "ERRAND";

  return null;
}

function getDeepValue(source: unknown, path: string) {
  return path.split(".").reduce<any>((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, source as any);
}

function findServiceInValue(value: unknown, seen = new WeakSet<object>()): KronixServiceType | null {
  if (value == null) return null;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return matchServiceKey(value) || matchServiceText(value);
  }

  if (typeof value !== "object") return null;

  if (seen.has(value as object)) return null;
  seen.add(value as object);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findServiceInValue(item, seen);
      if (found) return found;
    }
    return null;
  }

  const obj = value as Record<string, unknown>;

  const priorityKeys = [
    "serviceType",
    "serviceSlug",
    "serviceName",
    "serviceLabel",
    "serviceTitle",
    "slug",
    "type",
    "name",
    "label",
    "title",
    "requiredWorkerType",
    "workerType",
    "courierServiceType",
  ];

  for (const key of priorityKeys) {
    const found = matchServiceKey(obj[key]) || matchServiceText(obj[key]);
    if (found) return found;
  }

  for (const [key, nestedValue] of Object.entries(obj)) {
    const keyMatch = matchServiceKey(key) || matchServiceText(key);
    const valueMatch = findServiceInValue(nestedValue, seen);

    if (keyMatch === "TAXI" || keyMatch === "MOTORCARGO" || keyMatch === "PACKAGE" || keyMatch === "DELIVERY") {
      return keyMatch;
    }

    if (valueMatch) return valueMatch;
  }

  return null;
}

/**
 * Detecta el tipo de servicio usando varios campos posibles.
 *
 * Esto es importante para la Fase 2:
 * hoy pueden llegar serviceType/courierServiceType/requiredWorkerType,
 * mañana podrá llegar serviceSlug o datos dinámicos desde CTCC.
 */
export function getOrderServiceType(order: Partial<DriverOrder> & Record<string, any>): KronixServiceType {
  const serviceFields = [
    "serviceType",
    "serviceSlug",
    "serviceName",
    "serviceLabel",
    "serviceTitle",
    "service.slug",
    "service.type",
    "service.name",
    "service.label",
    "service.title",
    "metadata.serviceType",
    "metadata.serviceSlug",
    "metadata.serviceName",
    "metadata.workerType",
    "extra.serviceType",
    "extra.serviceSlug",
    "extra.serviceName",
  ];

  for (const field of serviceFields) {
    const found = matchServiceKey(getDeepValue(order, field)) || matchServiceText(getDeepValue(order, field));
    if (found && found !== "STORE") return found;
  }

  const workerFields = [
    "requiredWorkerType",
    "workerType",
    "worker.workerType",
    "worker.type",
    "authorization.workerType",
    "authorization.workerTypeKey",
    "authorization.workerTypeSlug",
    "workerServiceAuthorization.workerType",
    "workerServiceAuthorization.workerTypeKey",
    "workerServiceAuthorization.workerTypeSlug",
  ];

  for (const field of workerFields) {
    const found = matchServiceKey(getDeepValue(order, field)) || matchServiceText(getDeepValue(order, field));
    if (found === "TAXI" || found === "MOTORCARGO") return found;
  }

  const legacy = matchServiceKey(order?.courierServiceType);
  if (legacy && legacy !== "UNKNOWN") return legacy;

  const deepService = findServiceInValue(order);
  if (deepService && deepService !== "STORE") return deepService;

  const orderType = matchServiceKey(order?.orderType);
  if (orderType === "STORE") return "STORE";

  if (Array.isArray(order?.stores) && order.stores.length > 0) return "STORE";

  // Fallback exclusivo para Tienda en Línea.
  // Algunas órdenes STORE de la Worker App no llegan con orderType,
  // pero sí traen datos propios de tienda/negocio.
  // Esto evita que se muestren como "Servicio KroniX".
  if (
    order?.storeName ||
    order?.storeId ||
    order?.store?.name ||
    order?.store?.id ||
    (Array.isArray(order?.pickupLocations) && order.pickupLocations.length > 0 && !order?.courierServiceType)
  ) {
    return "STORE";
  }

  return "UNKNOWN";
}

export function getServiceConfig(orderOrType: Partial<DriverOrder> | string | null | undefined) {
  const serviceType =
    typeof orderOrType === "string"
      ? matchServiceKey(orderOrType) ?? "UNKNOWN"
      : getOrderServiceType((orderOrType ?? {}) as any);

  return SERVICE_CONFIGS[serviceType] ?? SERVICE_CONFIGS.UNKNOWN;
}

export function getServiceAssetsSlug(orderOrType: Partial<DriverOrder> | string | null | undefined) {
  return getServiceConfig(orderOrType).assetSlug;
}

export function getServiceImageSrc(
  orderOrType: Partial<DriverOrder> | string | null | undefined,
  side: "left" | "right" = "left"
) {
  const config = getServiceConfig(orderOrType);
  if (config.serviceType === "STORE") return "/branding/kronix/card-comprar.png";
  return `/services/${config.assetSlug}/${side === "right" ? "cardder" : "cardizq"}.png`;
}

export function isOperationalService(order: Partial<DriverOrder> & Record<string, any>) {
  const type = getOrderServiceType(order);
  return type !== "STORE" && type !== "UNKNOWN";
}

export function getPickupPointTitle(order: Partial<DriverOrder> & Record<string, any>) {
  const type = getOrderServiceType(order);
  if (type === "TAXI") return "Punto de encuentro";
  if (type === "STORE") return "Recogidas";
  return "Punto de recogida";
}

export function formatPackageLabel(order: Partial<DriverOrder> & Record<string, any>) {
  const type = getOrderServiceType(order);
  if (type === "TAXI") return "Datos del servicio";
  if (type === "MOTORCARGO") return "Descripción de la carga";
  if (type === "PACKAGE") return "Descripción del paquete";
  return "Descripción del servicio";
}

export function getAvailableServiceMeta(order: Partial<DriverOrder> & Record<string, any>) {
  const config = getServiceConfig(order);
  const tuning = AVAILABLE_SERVICE_IMAGE_TUNING[config.serviceType] ?? AVAILABLE_SERVICE_IMAGE_TUNING.UNKNOWN;

  return {
    label: config.serviceType === "DELIVERY" ? config.shortLabel : config.label,
    tone: config.tone,
    panelTone: config.panelTone,
    imageSrc: getServiceImageSrc(config.serviceType, "right"),
    imageAlt: config.imageAlt,
    imageWrap: tuning.imageWrap,
    imageClassName: tuning.imageClassName,
  };
}

export function getAssignedServiceMeta(order: Partial<DriverOrder> & Record<string, any>) {
  const config = getServiceConfig(order);
  const serviceType = config.serviceType;

  const custom = {
    PACKAGE: {
      headerTitle: "Dirígete al punto de recogida",
      navigateText: "Navegar al punto de recogida",
      arrivedText: "Llegué al punto de recogida",
      readySingleText: "Ya puede iniciar con el servicio.",
      footerText: "Este servicio ya está reservado para ti.",
    },
    TAXI: {
      headerTitle: "Dirígete al punto de encuentro",
      navigateText: "Navegar al pasajero",
      arrivedText: "Llegué por el pasajero",
      readySingleText: "Ya puede iniciar el servicio.",
      footerText: "Este servicio de Taxi ya está reservado para ti.",
    },
    MOTORCARGO: {
      headerTitle: "Dirígete al punto de recogida",
      navigateText: "Navegar al punto de recogida",
      arrivedText: "Llegué por la carga",
      readySingleText: "Ya puede iniciar el servicio.",
      footerText: "Este servicio de Motocarga ya está reservado para ti.",
    },
    DELIVERY: {
      headerTitle: "Dirígete al punto de recogida",
      navigateText: "Navegar al punto de recogida",
      arrivedText: "Llegué al punto de recogida",
      readySingleText: "Ya puede iniciar con el servicio.",
      footerText: "Este servicio ya está reservado para ti.",
    },
    STORE: {
      headerTitle: "Dirígete al negocio",
      navigateText: "Navegar al negocio",
      arrivedText: "Llegué al negocio",
      readySingleText: "ya tiene el pedido listo.",
      footerText: "Este pedido ya está reservado para ti.",
    },
  } as const;

  const text = (custom as any)[serviceType] ?? custom.DELIVERY;

  return {
    label: config.label,
    workerLabel: config.workerLabel,
    workerPluralLabel: config.workerPluralLabel,
    imageSrc: getServiceImageSrc(config.serviceType, "left"),
    imageAlt: config.imageAlt,
    tone: config.tone,
    heroTone: config.heroTone,
    ...text,
  };
}

export function getPickupServiceMeta(order: Partial<DriverOrder> & Record<string, any>) {
  const config = getServiceConfig(order);
  const serviceType = config.serviceType;

  const custom = {
    PACKAGE: {
      headerTitle: "Confirma la recogida del paquete",
      pickedUpText: "Recogí el paquete",
      modalTitle: "Confirmación del paquete",
      modalDescription: "Verifica que recibiste correctamente el paquete antes de continuar al destino.",
      footerText: "Al confirmar, el servicio pasará a En ruta.",
    },
    TAXI: {
      headerTitle: "Confirma que el pasajero abordó",
      pickedUpText: "Pasajero abordó",
      modalTitle: "Confirmación de pasajero",
      modalDescription: "Confirma que el pasajero ya está contigo antes de iniciar el recorrido.",
      footerText: "Al confirmar, el servicio pasará a En ruta.",
    },
    MOTORCARGO: {
      headerTitle: "Confirma la recogida de la carga",
      pickedUpText: "Recogí la carga",
      modalTitle: "Confirmación de carga",
      modalDescription: "Verifica que recibiste correctamente la carga antes de continuar al destino.",
      footerText: "Al confirmar, el servicio pasará a En ruta.",
    },
    DELIVERY: {
      headerTitle: "Confirma la recogida del encargo",
      pickedUpText: "Recogí el encargo",
      modalTitle: "Confirmación del encargo",
      modalDescription: "Marca las casillas para confirmar que ya recibiste correctamente el encargo.",
      footerText: "Al confirmar, el servicio pasará a En ruta.",
    },
    STORE: {
      headerTitle: "Confirma la recogida del pedido",
      pickedUpText: "Recogí el pedido",
      modalTitle: "Confirmación del pedido",
      modalDescription: "Marca las casillas para confirmar que ya recogiste correctamente el pedido.",
      footerText: "Al confirmar, el pedido pasará a En ruta.",
    },
  } as const;

  const text = (custom as any)[serviceType] ?? custom.DELIVERY;

  return {
    label: config.label,
    workerLabel: config.workerLabel,
    workerPluralLabel: config.workerPluralLabel,
    imageSrc: getServiceImageSrc(config.serviceType, "left"),
    imageAlt: config.imageAlt,
    tone: config.tone,
    heroTone: config.heroTone,
    ...text,
  };
}

export function getEnRouteServiceMeta(order: Partial<DriverOrder> & Record<string, any>) {
  const config = getServiceConfig(order);
  const serviceType = config.serviceType;

  const custom = {
    PACKAGE: {
      headerTitle: "Dirígete al punto final",
      destinationLabel: "Destino",
      navigateText: "Navegar al destino",
      deliveredText: "Entregué el paquete",
      footerText: "Confirmar finaliza el servicio.",
    },
    TAXI: {
      headerTitle: "Finaliza el recorrido",
      destinationLabel: "Destino del pasajero",
      navigateText: "Navegar al destino",
      deliveredText: "Finalicé el viaje",
      footerText: "Confirmar finaliza el servicio de Taxi.",
    },
    MOTORCARGO: {
      headerTitle: "Entrega la carga en destino",
      destinationLabel: "Destino de la carga",
      navigateText: "Navegar al destino",
      deliveredText: "Entregué la carga",
      footerText: "Confirmar finaliza el servicio de Motocarga.",
    },
    DELIVERY: {
      headerTitle: "Dirígete al punto final",
      destinationLabel: "Destino",
      navigateText: "Navegar al destino",
      deliveredText: "Completé el servicio",
      footerText: "Confirmar finaliza el servicio.",
    },
    STORE: {
      headerTitle: "Dirígete al cliente",
      destinationLabel: "Destino",
      navigateText: "Navegar al cliente",
      deliveredText: "Entregué el pedido",
      footerText: "Confirmar finaliza el pedido.",
    },
  } as const;

  const text = (custom as any)[serviceType] ?? custom.DELIVERY;

  return {
  label: config.label,
  workerLabel: config.workerLabel,
  workerPluralLabel: config.workerPluralLabel,

  // NUEVO
  showDestinationButton: config.serviceType === "STORE",

  imageSrc: getServiceImageSrc(config.serviceType, "left"),
  imageAlt: config.imageAlt,
  tone: config.tone,
  heroTone: config.heroTone,
  ...text,
};
}