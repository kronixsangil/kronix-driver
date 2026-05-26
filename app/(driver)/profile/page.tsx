// app/(driver)/profile/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getDriverMe } from "../../../lib/driverAuth";

import ProfileHeader from "./components/ProfileHeader";
import DriverIdentityCard from "./components/DriverIdentityCard";
import MetricsCard from "./components/cards/MetricsCard";

import {
  loadDriverHistoryWithSnapshot,
  type DriverHistoryItem,
} from "../lib/driverHistory";
import { useDriverCity } from "../components/DriverCityContext";

function levelFromDeliveries(count: number) {
  if (count >= 100) return { key: "PLATINO", next: null, min: 100 };
  if (count >= 50) return { key: "ORO", next: 100, min: 50 };
  if (count >= 20) return { key: "PLATA", next: 50, min: 20 };
  return { key: "BRONCE", next: 20, min: 0 };
}

type MeState = {
  fullName: string;
  email: string;
  phone?: string;
  vehicle?: string;
  payoutMethod?: string;
};

type ProfileImageNavCardProps = {
  title: string;
  desc: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  imageClassName?: string;
};

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
  });

  const [loadingMe, setLoadingMe] = useState(false);

  const [history, setHistory] = useState<DriverHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) =>
    setOpen((prev) => (prev === key ? null : key));

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

  const metrics = useMemo(() => {
    const delivered = history.filter((h) => h.status === "DELIVERED");
    const cancelled = history.filter((h) => h.status === "CANCELLED");

    return {
      deliveries: delivered.length,
      pickups: delivered.length,
      cancellations: cancelled.length,
      avgTime: "—",
      rating: "—",
    };
  }, [history]);

  const levelInfo = useMemo(() => {
    const lvl = levelFromDeliveries(metrics.deliveries);
    const progress =
      lvl.next === null
        ? 1
        : Math.min(1, (metrics.deliveries - lvl.min) / (lvl.next - lvl.min));

    return {
      ...lvl,
      progressPct: Math.round(progress * 100),
      remaining:
        lvl.next === null ? 0 : Math.max(0, lvl.next - metrics.deliveries),
      hasNext: lvl.next !== null,
    };
  }, [metrics.deliveries]);

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
          loading={loadingMe}
          levelKey={levelInfo.key}
          progressPct={levelInfo.progressPct}
          cityName={cityName ?? null}
          cityDepartment={cityDepartment ?? null}
          cityLabel={cityLabel ?? null}
          cityLoading={cityLoading}
        />

        <MetricsCard
  isOpen={open === "metricas"}
  onToggle={() => toggle("metricas")}
  deliveries={metrics.deliveries}
  cancellations={metrics.cancellations}
  avgTime={metrics.avgTime}
  rating={metrics.rating}
  levelKey={levelInfo.key}
  progressPct={levelInfo.progressPct}
  remaining={levelInfo.remaining}
  hasNext={levelInfo.next !== null}
  pickups={metrics.pickups}
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
          Consejo: tu perfil ya está alineado con la ciudad operativa real. ✅
        </div>

        <span className="hidden">
          <Link href="/profile/info">go</Link>
        </span>
      </div>
    </div>
  );
}