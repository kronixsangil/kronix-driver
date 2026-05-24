// app/(driver)/profile/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getDriverMe } from "../../../lib/driverAuth";

import ProfileHeader from "./components/ProfileHeader";
import DriverIdentityCard from "./components/DriverIdentityCard";
import MetricsCard from "./components/cards/MetricsCard";
import NavCard from "./components/cards/NavCard";

import { loadDriverHistoryWithSnapshot, type DriverHistoryItem } from "../lib/driverHistory";
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

export default function DriverProfilePage() {
  const { cityName, cityDepartment, cityLabel, loading: cityLoading } = useDriverCity();

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

  const [open, setOpen] = useState<string | null>("metricas");
  const toggle = (key: string) => setOpen((prev) => (prev === key ? null : key));

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
      remaining: lvl.next === null ? 0 : Math.max(0, lvl.next - metrics.deliveries),
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
          <div className="mx-2 rounded-2xl border border-gray-200 bg-white p-3 text-xs font-semibold text-gray-600 shadow-sm">
            Actualizando métricas…
          </div>
        ) : null}

        <div className="mx-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Ciudad operativa
              </div>
              <div className="mt-1 text-sm font-extrabold text-gray-900">{cityText}</div>
              <div className="mt-1 text-[12px] text-gray-600">
                Esta es la ciudad bajo la que operas actualmente en la app Driver.
              </div>
            </div>

            <div className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
              Multiciudad
            </div>
          </div>
        </div>

        <div className="space-y-2">          
          <NavCard title="Tu información" desc="Datos personales básicos" href="/profile/info" />
          <NavCard title="Vehículos" desc="Vehículo activo y administración" href="/profile/cars" />
          <NavCard title="Información de pago" desc="Métodos de pago y estado" href="/profile/pay-info" />
          <NavCard title="Seguridad" desc="Contraseña y sesiones" href="/profile/security" />
          <NavCard title="Instructivo" desc="Guías rápidas del conductor" href="/profile/instructions" />
<NavCard
  title="Términos y Condiciones"
  desc="Documento legal obligatorio para conductores"
  href="/profile/terms"
/>

<NavCard
  title="Política de Privacidad"
  desc="Datos personales, GPS, documentos y seguridad"
  href="/profile/privacy"
/>

<NavCard
  title="Acuerdo de Independencia"
  desc="Autonomía operativa y no subordinación"
  href="/profile/independence"
/>

<NavCard
  title="Manual Operativo y Seguridad"
  desc="Comportamiento, seguridad, servicio e incidentes"
  href="/profile/operational-security"
/>

<NavCard
  title="Política Antifraude"
  desc="Cuentas, pagos, GPS, suplantación y pedidos falsos"
  href="/profile/anti-fraud"
/>

<NavCard title="Soporte" desc="Ayuda y contacto" href="/profile/support" />
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