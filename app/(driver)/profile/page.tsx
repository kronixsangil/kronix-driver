// app/(driver)/profile/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getDriverMe } from "../../../lib/driverAuth";

import ProfileHeader from "./components/ProfileHeader";
import DriverIdentityCard from "./components/DriverIdentityCard";

import {
  loadDriverHistoryWithSnapshot,
  type DriverHistoryItem,
} from "../lib/driverHistory";
import { useDriverCity } from "../components/DriverCityContext";
import {
  getDriverRewardsMe,
  type DriverRewardsMeResponse,
} from "../lib/driverRewardsApi";

type MeState = {
  fullName: string;
  email: string;
  phone?: string;
  vehicle?: string;
  payoutMethod?: string;
  profileImageUrl?: string | null;
};

type ProfileImageNavCardProps = {
  title: string;
  desc: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  imageClassName?: string;
};

type RewardView = {
  tierCode: string;
  tierName: string;
  badgeLabel: string;
  currentPoints: number;
  currentMonthPoints: number;
  currentMonthDeliveries: number;
  reliabilityPercent: number;
  averageRating: number;
  isPioneer: boolean;
  progressPct: number;
};

const DEFAULT_REWARD_VIEW: RewardView = {
  tierCode: "BRONCE",
  tierName: "Bronce",
  badgeLabel: "BRONCE",
  currentPoints: 0,
  currentMonthPoints: 0,
  currentMonthDeliveries: 0,
  reliabilityPercent: 100,
  averageRating: 5,
  isPioneer: false,
  progressPct: 0,
};

function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeTierCode(value?: string | null) {
  return String(value ?? "BRONCE").trim().toUpperCase() || "BRONCE";
}

function prettyTierName(value?: string | null, code?: string | null) {
  const clean = String(value ?? "").trim();
  if (clean) return clean;

  const tierCode = normalizeTierCode(code);
  if (tierCode === "PIONERO") return "Pionero";
  if (tierCode === "ELITE") return "Elite";
  if (tierCode === "ORO") return "Oro";
  if (tierCode === "PLATA") return "Plata";
  return "Bronce";
}

function buildRewardView(rewards: DriverRewardsMeResponse | null): RewardView {
  if (!rewards) return DEFAULT_REWARD_VIEW;

  const rawCode = normalizeTierCode(rewards?.tier?.code);
  const isPioneer = Boolean(rewards?.isPioneer) || rawCode === "PIONERO";
  const tierCode = isPioneer ? "PIONERO" : rawCode;
  const tierName = isPioneer
    ? "Pionero"
    : prettyTierName(rewards?.tier?.name, rewards?.tier?.code);

  const currentPoints = safeNumber(rewards?.currentPoints, 0);
  const currentMonthPoints = safeNumber(rewards?.currentMonthPoints, 0);
  const currentMonthDeliveries = safeNumber(rewards?.currentMonthDeliveries, 0);
  const reliabilityPercent = Math.max(
    0,
    Math.min(100, safeNumber(rewards?.reliabilityPercent, 100))
  );
  const averageRating = safeNumber(rewards?.averageRating, 5);

  const progressPct = Math.max(
    0,
    Math.min(100, Math.round((currentMonthPoints / 100) * 100))
  );

  return {
    tierCode,
    tierName,
    badgeLabel: tierCode,
    currentPoints,
    currentMonthPoints,
    currentMonthDeliveries,
    reliabilityPercent,
    averageRating,
    isPioneer,
    progressPct,
  };
}

function ProfileImageNavCard({
  title,
  desc,
  href,
  imageSrc,
  imageAlt,
  imageClassName = "scale-[1.25] translate-x-[0px] translate-y-[0px]",
}: ProfileImageNavCardProps) {
  return (
    <Link
      href={href}
      className="relative mx-0 block overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-visible">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="64px"
            className={[
              "pointer-events-none select-none object-contain drop-shadow-sm",
              imageClassName,
            ].join(" ")}
          />
        </div>

        <div className="relative z-10 min-w-0 flex-1">
          <div className="text-xl font-black leading-6 text-slate-950">
            {title}
          </div>
          <div className="mt-1 text-[13px] leading-5 text-slate-600">
            {desc}
          </div>
        </div>

        <div className="relative z-10 shrink-0 text-xl font-bold text-slate-400">
          ›
        </div>
      </div>
    </Link>
  );
}

function KronixRewardsCard({
  rewards,
  loading,
}: {
  rewards: RewardView;
  loading: boolean;
}) {
  return (
    <section className="mx-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-700 px-5 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">
              KroniX Rewards
            </div>
            <h2 className="mt-2 text-2xl font-black leading-7">
              {loading ? "Actualizando nivel…" : rewards.tierName}
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-white/80">
              Sistema actual de prioridad, puntos y desempeño mensual.
            </p>
          </div>

          <div className="shrink-0 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-black shadow-sm backdrop-blur">
            {rewards.badgeLabel}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <RewardMiniStat label="Puntos" value={rewards.currentPoints} />
          <RewardMiniStat label="Mes" value={rewards.currentMonthPoints} />
          <RewardMiniStat label="Entregas" value={rewards.currentMonthDeliveries} />
        </div>
      </div>

      <div className="p-5">
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black text-slate-950">
                Prioridad operativa
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">
                {rewards.isPioneer
                  ? "Pionero activo: prioridad máxima cuando CTCC habilite prioridad."
                  : `Nivel actual: ${rewards.tierName}.`}
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-700">
              {rewards.isPioneer ? "PIONERO" : rewards.tierCode}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Progreso mensual por puntos</span>
              <span>{rewards.progressPct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${rewards.progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <RewardDetail label="Confiabilidad" value={`${Math.round(rewards.reliabilityPercent)}%`} />
          <RewardDetail label="Calificación" value={rewards.averageRating.toFixed(1)} />
        </div>
      </div>
    </section>
  );
}

function RewardMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/12 px-3 py-3 text-center ring-1 ring-white/15">
      <div className="text-lg font-black leading-5">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/70">
        {label}
      </div>
    </div>
  );
}

function RewardDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function PerformanceSummaryCard({
  deliveries,
  cancellations,
}: {
  deliveries: number;
  cancellations: number;
}) {
  return (
    <section className="mx-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">Mis métricas</h2>
          <p className="mt-1 text-[13px] font-medium text-slate-500">
            Resumen operativo sin calcular niveles antiguos.
          </p>
        </div>
        <div className="rounded-full bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200">
          Hoy
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-bold text-slate-500">Entregas históricas</div>
          <div className="mt-2 text-2xl font-black text-slate-950">{deliveries}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-bold text-slate-500">Cancelaciones</div>
          <div className="mt-2 text-2xl font-black text-slate-950">{cancellations}</div>
        </div>
      </div>
    </section>
  );
}

export default function DriverProfilePage() {
  const {
    cityName,
    cityDepartment,
    cityLabel,
    loading: cityLoading,
  } = useDriverCity();

  const [me, setMe] = useState<MeState>({
    fullName: "Conductor",
    email: "—",
    phone: "—",
    vehicle: "—",
    payoutMethod: "—",
    profileImageUrl: null,
  });

  const [loadingMe, setLoadingMe] = useState(false);
  const [history, setHistory] = useState<DriverHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rewards, setRewards] = useState<DriverRewardsMeResponse | null>(null);
  const [loadingRewards, setLoadingRewards] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      setLoadingMe(true);
      try {
        const out: any = await getDriverMe();
        if (!mounted) return;

        const fullName = String(out?.user?.name ?? "").trim() || "Conductor";
        const email = String(out?.user?.email ?? "").trim() || "—";

        setMe((prev) => ({
          ...prev,
          fullName,
          email,
          phone: out?.user?.phone ?? prev.phone ?? "—",
          profileImageUrl: out?.user?.profileImageUrl ?? prev.profileImageUrl ?? null,
        }));
      } catch {
        // fallback
      } finally {
        if (mounted) setLoadingMe(false);
      }
    }

    loadMe();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      setLoadingHistory(true);
      try {
        const data = await loadDriverHistoryWithSnapshot();
        if (mounted) setHistory(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setHistory([]);
      } finally {
        if (mounted) setLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadRewards() {
      setLoadingRewards(true);
      try {
        const data = await getDriverRewardsMe();
        if (mounted) setRewards(data);
      } catch {
        if (mounted) setRewards(null);
      } finally {
        if (mounted) setLoadingRewards(false);
      }
    }

    loadRewards();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const delivered = history.filter((h) => h.status === "DELIVERED");
    const cancelled = history.filter((h) => h.status === "CANCELLED");

    return {
      deliveries: delivered.length,
      cancellations: cancelled.length,
    };
  }, [history]);

  const rewardView = useMemo(() => buildRewardView(rewards), [rewards]);

  const cityText = cityLoading
    ? "Cargando ciudad..."
    : cityLabel || cityName || "Ciudad no asignada";

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-4">
        <ProfileHeader cityLabel={cityText} loading={cityLoading} />

        <DriverIdentityCard
          fullName={me.fullName}
          email={me.email}
          loading={loadingMe || loadingRewards}
          levelKey={rewardView.badgeLabel}
          progressPct={rewardView.progressPct}
          cityName={cityName ?? null}
          cityDepartment={cityDepartment ?? null}
          cityLabel={cityLabel ?? null}
          cityLoading={cityLoading}
          profileImageUrl={me.profileImageUrl ?? null}
        />

        <KronixRewardsCard rewards={rewardView} loading={loadingRewards} />

        <PerformanceSummaryCard
          deliveries={metrics.deliveries}
          cancellations={metrics.cancellations}
        />

        {loadingHistory ? (
          <div className="mx-0 rounded-2xl border border-gray-200 bg-white p-3 text-xs font-semibold text-gray-600 shadow-sm">
            Actualizando métricas…
          </div>
        ) : null}

        <div className="space-y-2">
          <ProfileImageNavCard
            title="Tu información"
            desc="Datos personales básicos"
            href="/profile/info"
            imageSrc="/branding/Profile/informacion.png"
            imageAlt="Tu información"
            imageClassName="scale-[1.28] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="Vehículos"
            desc="Vehículo activo y administración"
            href="/profile/cars"
            imageSrc="/branding/Profile/Vehiculos.png"
            imageAlt="Vehículos"
            imageClassName="scale-[1.28] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="Información de pago"
            desc="Métodos de pago y estado"
            href="/profile/pay-info"
            imageSrc="/branding/Profile/Payments.png"
            imageAlt="Información de pago"
            imageClassName="scale-[1.3] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="Seguridad"
            desc="Contraseña y sesiones"
            href="/profile/security"
            imageSrc="/branding/Profile/seguridad.png"
            imageAlt="Seguridad"
            imageClassName="scale-[1.25] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="Instructivo"
            desc="Guías rápidas del conductor"
            href="/profile/instructions"
            imageSrc="/branding/Profile/instructivo.png"
            imageAlt="Instructivo"
            imageClassName="scale-[1.28] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="T. y C."
            desc="Documento legal obligatorio para conductores"
            href="/profile/terms"
            imageSrc="/branding/Profile/tyc.png"
            imageAlt="Términos y Condiciones"
            imageClassName="scale-[1.25] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="Política de Privacidad"
            desc="Datos personales, GPS, documentos y seguridad"
            href="/profile/privacy"
            imageSrc="/branding/Profile/privacidad.png"
            imageAlt="Política de Privacidad"
            imageClassName="scale-[1.25] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="Acuerdo de Independencia"
            desc="Autonomía operativa y no subordinación"
            href="/profile/independence"
            imageSrc="/branding/Profile/Independence.png"
            imageAlt="Acuerdo de Independencia"
            imageClassName="scale-[1.27] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="Manual Operativo"
            desc="Comportamiento, seguridad, servicio e incidentes"
            href="/profile/operational-security"
            imageSrc="/branding/Profile/seguridad.png"
            imageAlt="Manual Operativo y Seguridad"
            imageClassName="scale-[1.2] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="Política Antifraude"
            desc="Cuentas, pagos, GPS, suplantación y pedidos falsos"
            href="/profile/anti-fraud"
            imageSrc="/branding/Profile/fraud-prevention.png"
            imageAlt="Política Antifraude"
            imageClassName="scale-[1.25] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="Academia KroniX"
            desc="Capacitación rápida para conductores"
            href="/profile/academy"
            imageSrc="/branding/Profile/Academy.png"
            imageAlt="Academia KroniX"
            imageClassName="scale-[1.25] translate-x-[0px] translate-y-[0px]"
          />

          <ProfileImageNavCard
            title="Soporte"
            desc="Ayuda y contacto"
            href="/profile/support"
            imageSrc="/branding/Profile/soporte.png"
            imageAlt="Soporte"
            imageClassName="scale-[1.23] translate-x-[0px] translate-y-[0px]"
          />
        </div>

        <div className="text-center text-[11px] text-gray-500">
          Consejo: tu nivel ahora viene desde KroniX Rewards. ✅
        </div>

        <span className="hidden">
          <Link href="/profile/info">go</Link>
        </span>
      </div>
    </div>
  );
}
