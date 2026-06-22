// app/(driver)/lib/driverRewardsApi.ts
import { apiFetch } from "../../../lib/apiFetch";

export type DriverRewardTier = {
  id?: string;
  code?: string | null;
  name?: string | null;
  priority?: number | null;
  badgeColor?: string | null;
};

export type DriverRewardsMeResponse = {
  id?: string;
  driverId?: string;
  tierId?: string | null;
  currentPoints?: number | null;
  currentMonthPoints?: number | null;
  currentMonthDeliveries?: number | null;
  reliabilityPercent?: number | null;
  averageRating?: number | null;
  isPioneer?: boolean | null;
  lastTierChangeAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  tier?: DriverRewardTier | null;
};

export async function getDriverRewardsMe(): Promise<DriverRewardsMeResponse | null> {
  try {
    const data = await apiFetch<DriverRewardsMeResponse | null>(
      "/drivers/rewards/me",
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      }
    );

    return data ?? null;
  } catch {
    return null;
  }
}
