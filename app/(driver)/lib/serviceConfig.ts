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

export function getOrderServiceType(order: Partial<DriverOrder> & Record<string, any>): KronixServiceType {
  const direct = String(order?.serviceType ?? "").trim().toUpperCase();
  if (direct === "STORE") return "STORE";
  if (direct === "DELIVERY") return "DELIVERY";
  if (direct === "PACKAGE") return "PACKAGE";
  if (direct === "TAXI") return "TAXI";
  if (direct === "MOTORCARGO") return "MOTORCARGO";

  const legacy = String(order?.courierServiceType ?? "").trim().toUpperCase();
  if (legacy === "PICKUP_AND_DELIVERY") return "DELIVERY";
  if (legacy === "SEND_PACKAGE") return "PACKAGE";
  if (legacy === "ERRAND") return "ERRAND";

  const orderType = String(order?.orderType ?? "").trim().toUpperCase();
  if (orderType === "STORE") return "STORE";

  return "UNKNOWN";
}

export function getServiceConfig(orderOrType: Partial<DriverOrder> | string | null | undefined) {
  const serviceType =
    typeof orderOrType === "string"
      ? (orderOrType.trim().toUpperCase() as KronixServiceType)
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

  if (config.serviceType === "STORE") {
    return {
      label: config.label,
      tone: config.tone,
      panelTone: config.panelTone,
      imageSrc: getServiceImageSrc(config.serviceType, "right"),
      imageAlt: config.imageAlt,
      imageWrap: "h-[72px] w-[92px]",
      imageClassName: "object-contain scale-[1.5] translate-x-[10px] translate-y-[2px]",
    };
  }

  return {
    label: config.serviceType === "DELIVERY" ? config.shortLabel : config.label,
    tone: config.tone,
    panelTone: config.panelTone,
    imageSrc: getServiceImageSrc(config.serviceType, "right"),
    imageAlt: config.imageAlt,
    imageWrap: "h-[74px] w-[104px]",
    imageClassName:
      config.serviceType === "TAXI"
        ? "object-contain scale-[1.18] translate-x-[2px] translate-y-[4px]"
        : config.serviceType === "MOTORCARGO"
          ? "object-contain scale-[1.16] translate-x-[2px] translate-y-[4px]"
          : "object-contain scale-[1.25] translate-x-[4px] translate-y-[3px]",
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
    imageSrc: getServiceImageSrc(config.serviceType, "left"),
    imageAlt: config.imageAlt,
    tone: config.tone,
    heroTone: config.heroTone,
    ...text,
  };
}
