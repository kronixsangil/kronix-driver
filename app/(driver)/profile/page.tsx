// app/(driver)/profile/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getDriverMe } from "../../../lib/driverAuth";

import ProfileHeader from "./components/ProfileHeader";

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
  return (
    String(value ?? "BRONCE")
      .trim()
      .toUpperCase() || "BRONCE"
  );
}

function prettyTierName(value?: string | null, code?: string | null) {
  const clean = String(value ?? "").trim();
  if (clean) return clean;

  const tierCode = normalizeTierCode(code);
  if (tierCode === "PIONERO") return "Pionero";
  if (tierCode === "ELITE") return "Elite";
  if (tierCode === "ÉLITE") return "Élite";
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
    Math.min(100, safeNumber(rewards?.reliabilityPercent, 100)),
  );
  const averageRating = safeNumber(rewards?.averageRating, 5);

  const progressPct = Math.max(
    0,
    Math.min(100, Math.round((currentMonthPoints / 100) * 100)),
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

function slugDriverImageName(fullName: string) {
  const clean = String(fullName ?? "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_ÁÉÍÓÚÜÑáéíóúüñ-]/g, "");

  return clean || "default";
}

function getDriverPictureSrc(fullName: string, profileImageUrl?: string | null) {
  const cleanProfileUrl = String(profileImageUrl ?? "").trim();
  if (cleanProfileUrl) return cleanProfileUrl;

  const fileName = slugDriverImageName(fullName);
  return `/branding/Driver_Pictures/${encodeURIComponent(fileName)}.jpg`;
}

function getTierBadgeImage(tierCode: string) {
  const code = normalizeTierCode(tierCode);

  if (code === "PIONERO") return "/branding/Insignias/Pionero.png";
  if (code === "ELITE" || code === "ÉLITE") return "/branding/Insignias/Élite.png";
  if (code === "ORO") return "/branding/Insignias/Oro.png";
  if (code === "PLATA") return "/branding/Insignias/Plata.png";
  return "/branding/Insignias/Bronce.png";
}

function getTierBadgeAlt(tierCode: string) {
  const code = normalizeTierCode(tierCode);

  if (code === "PIONERO") return "Insignia Pionero";
  if (code === "ELITE" || code === "ÉLITE") return "Insignia Élite";
  if (code === "ORO") return "Insignia Oro";
  if (code === "PLATA") return "Insignia Plata";
  return "Insignia Bronce";
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

function DriverPhotoBubble({
  fullName,
  profileImageUrl,
}: {
  fullName: string;
  profileImageUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const initials = String(fullName ?? "Conductor")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "DR";

  const src = getDriverPictureSrc(fullName, profileImageUrl);

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/35 bg-white/15 shadow-sm ring-1 ring-white/25">
      {!failed ? (
        <Image
          src={src}
          alt={`Foto de ${fullName}`}
          fill
          sizes="48px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-black text-white">
          {initials}
        </div>
      )}
    </div>
  );
}

function DriverIdentityWithBadge({
  me,
  rewardView,
  loading,
}: {
  me: MeState;
  rewardView: RewardView;
  loading: boolean;
}) {
  const badgeSrc = getTierBadgeImage(rewardView.tierCode);
  const badgeAlt = getTierBadgeAlt(rewardView.tierCode);
  const progress = Math.max(0, Math.min(100, rewardView.progressPct));

  return (
    <section className="relative mx-0 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-500 px-4 py-3 text-white shadow-sm">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_95%_40%,rgba(255,255,255,0.12),transparent_28%)]" />

      <div className="relative z-10 grid grid-cols-[52px_minmax(0,1fr)_92px] items-center gap-3">
        <DriverPhotoBubble
          fullName={me.fullName}
          profileImageUrl={me.profileImageUrl}
        />

        <div className="min-w-0 pr-1">
          <div className="truncate text-[15px] font-black leading-5">
            {loading ? "Actualizando…" : me.fullName}
          </div>
          <div className="mt-0.5 truncate text-[11px] font-bold text-white/90">
            {me.email}
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between gap-2 text-[10px] font-black text-white">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/35">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative h-[82px] w-[92px] justify-self-end">
          <Image
            src={badgeSrc}
            alt={badgeAlt}
            fill
            priority
            sizes="92px"
            className="object-contain drop-shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}

function CompactMetricsCard({
  rewards,
  deliveries,
  cancellations,
  loading,
  isOpen,
  onToggle,
}: {
  rewards: RewardView;
  deliveries: number;
  cancellations: number;
  loading: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="mx-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex w-full items-center gap-4 px-4 py-4 text-left active:scale-[0.99]"
        aria-expanded={isOpen}
      >
        <div className="relative h-16 w-16 shrink-0 overflow-visible">
          <Image
            src="/branding/Profile/Metrics.png"
            alt="Métricas"
            fill
            sizes="64px"
            className="pointer-events-none select-none object-contain drop-shadow-sm scale-[1.28]"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xl font-black leading-6 text-slate-950">
            Métricas
          </div>
          <div className="mt-1 text-[13px] leading-5 text-slate-600">
            Puntos, entregas y desempeño
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-200">
            {loading ? "..." : rewards.badgeLabel}
          </span>
          <span className="text-[13px] font-black text-slate-500">
            {isOpen ? "Ocultar" : "Ver"}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="grid grid-cols-3 gap-2">
            <MetricPill label="Puntos" value={rewards.currentPoints} />
            <MetricPill label="Mes" value={rewards.currentMonthPoints} />
            <MetricPill
              label="Entregas"
              value={rewards.currentMonthDeliveries}
            />
          </div>

          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-slate-500">
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

          <div className="mt-3 grid grid-cols-2 gap-2">
            <MetricBox
              label="Confiabilidad"
              value={`${Math.round(rewards.reliabilityPercent)}%`}
            />
            <MetricBox
              label="Calificación"
              value={rewards.averageRating.toFixed(1)}
            />
            <MetricBox label="Históricas" value={deliveries} />
            <MetricBox label="Cancelaciones" value={cancellations} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
      <div className="text-lg font-black leading-5 text-slate-950">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="text-[11px] font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-950">{value}</div>
    </div>
  );
}

export default function DriverProfilePage() {
  const {
    cityName,
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
  const [metricsOpen, setMetricsOpen] = useState(false);

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
          profileImageUrl:
            out?.user?.profileImageUrl ?? prev.profileImageUrl ?? null,
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
      <div className="mx-auto w-full max-w-md space-y-3 px-0 pb-24 pt-0">
        <ProfileHeader cityLabel={cityText} loading={cityLoading} />

        <DriverIdentityWithBadge
          me={me}
          rewardView={rewardView}
          loading={loadingMe || loadingRewards}
        />

        <CompactMetricsCard
          rewards={rewardView}
          deliveries={metrics.deliveries}
          cancellations={metrics.cancellations}
          loading={loadingRewards}
          isOpen={metricsOpen}
          onToggle={() => setMetricsOpen((open) => !open)}
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

        <span className="hidden">
          <Link href="/profile/info">go</Link>
        </span>
      </div>
    </div>
  );
}

