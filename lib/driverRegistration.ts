//lib\driverRegistration.ts
//lib\driverRegistration.ts
"use client";

import { apiFetch } from "./apiFetch";

export type PublicCity = {
  id: string;
  slug: string;
  name: string;
  department: string;
  country: string;
};

export type PublicDynamicService = {
  id: string;
  serviceKey: string;
  slug: string;
  name: string;
  shortName: string;
  description: string | null;
  workerTypeKey: string;
  workerLabel: string;
  icon: string | null;
  requiresVehicle: boolean;
  primaryColor: string;
  accentColor: string;
  isActive: boolean;
  sortOrder: number;
};

export type RegisterDriverInput = {
  name: string;
  phone: string;
  email?: string;
  password: string;
  cityId: string;
  documentId: string;
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  serviceKeys: string[];
  termsAccepted: boolean;
  termsVersion: string;
};

export async function listPublicCities(): Promise<PublicCity[]> {
  const out = await apiFetch<{ items?: PublicCity[] }>("/public/cities", {
    method: "GET",
    cache: "no-store",
  });

  return Array.isArray(out?.items) ? out.items : [];
}

export async function listPublicWorkerServices(
  citySlug: string
): Promise<PublicDynamicService[]> {
  const slug = String(citySlug ?? "").trim();

  if (!slug) return [];

  const out = await apiFetch<{ items?: any[] }>(
    `/public/services?citySlug=${encodeURIComponent(slug)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const items = Array.isArray(out?.items) ? out.items : [];

  return items
    .filter((item) => item?.isActive !== false)
    .map((item) => ({
      id: String(item?.id ?? ""),
      serviceKey: String(
        item?.serviceKey ??
          item?.key ??
          item?.serviceType ??
          item?.slug ??
          ""
      )
        .trim()
        .toUpperCase(),
      slug: String(item?.slug ?? ""),
      name: String(
        item?.name ??
          item?.title ??
          item?.shortName ??
          item?.serviceKey ??
          "Servicio"
      ),
      shortName: String(
        item?.shortName ??
          item?.name ??
          item?.title ??
          item?.serviceKey ??
          "Servicio"
      ),
      description: item?.description ? String(item.description) : null,
      workerTypeKey: String(
        item?.workerTypeKey ??
          item?.workerType ??
          item?.config?.workerType ??
          "MOTORCYCLE"
      )
        .trim()
        .toUpperCase(),
      workerLabel: String(
        item?.workerLabel ??
          item?.workerName ??
          item?.config?.workerLabel ??
          "Trabajador"
      ),
      icon: item?.icon ? String(item.icon) : null,
      requiresVehicle: Boolean(
        item?.requiresVehicle ??
          item?.vehicleRequired ??
          item?.config?.requiresVehicle ??
          item?.config?.vehicleRequired ??
          false
      ),
      primaryColor: String(item?.primaryColor ?? "#2563EB"),
      accentColor: String(item?.accentColor ?? "#EFF6FF"),
      isActive: Boolean(item?.isActive ?? true),
      sortOrder: Number(item?.sortOrder ?? item?.order ?? 100),
    }))
    .filter((item) => Boolean(item.serviceKey))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function registerDriver(input: RegisterDriverInput) {
  return apiFetch<{
    ok: boolean;
    status: string;
    message: string;
    user: {
      id: string;
      name: string;
      phone: string;
      email?: string | null;
    };
  }>("/auth/driver/register", {
    method: "POST",
    body: JSON.stringify(input),
    cache: "no-store",
  });
}