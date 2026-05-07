//app/(driver)/profile/components/DriverIdentityCard.tsx
"use client";

import { useMemo } from "react";
import { Shield, Crown, Award, Gem, MapPin } from "lucide-react";

type Props = {
  fullName: string;
  email: string;
  loading?: boolean;
  levelKey?: "BRONCE" | "PLATA" | "ORO" | "PLATINO" | string;
  progressPct?: number;

  // ✅ multiciudad
  cityName?: string | null;
  cityDepartment?: string | null;
  cityLabel?: string | null;
  cityLoading?: boolean;
};

function shortName(name: string) {
  const n = String(name ?? "").trim();
  if (!n) return "C";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const a = parts[0]?.[0] ?? "C";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function maskEmail(email: string) {
  const e = String(email ?? "").trim();
  if (!e || e === "—") return "—";
  const [user, domain] = e.split("@");
  if (!domain) return e;

  const u = user ?? "";
  if (u.length <= 2) return `${u}***@${domain}`;
  return `${u.slice(0, 2)}***@${domain}`;
}

function clampPct(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function levelStyle(levelKey?: string) {
  const k = String(levelKey ?? "BRONCE").toUpperCase();

  if (k === "PLATINO") {
    return {
      label: "PLATINO",
      pill: "bg-white/15 text-white border-white/25",
      iconWrap: "bg-white/15 border-white/20",
      icon: <Gem className="h-5 w-5 text-white" />,
    };
  }

  if (k === "ORO") {
    return {
      label: "ORO",
      pill: "bg-white/15 text-white border-white/25",
      iconWrap: "bg-white/15 border-white/20",
      icon: <Crown className="h-5 w-5 text-white" />,
    };
  }

  if (k === "PLATA") {
    return {
      label: "PLATA",
      pill: "bg-white/15 text-white border-white/25",
      iconWrap: "bg-white/15 border-white/20",
      icon: <Award className="h-5 w-5 text-white" />,
    };
  }

  return {
    label: "BRONCE",
    pill: "bg-white/15 text-white border-white/25",
    iconWrap: "bg-white/15 border-white/20",
    icon: <Shield className="h-5 w-5 text-white" />,
  };
}

export default function DriverIdentityCard({
  fullName,
  email,
  loading = false,
  levelKey = "BRONCE",
  progressPct = 0,
  cityName = null,
  cityDepartment = null,
  cityLabel = null,
  cityLoading = false,
}: Props) {
  const initials = useMemo(() => shortName(fullName), [fullName]);
  const safeEmail = useMemo(() => maskEmail(email), [email]);
  const lvl = useMemo(() => levelStyle(levelKey), [levelKey]);
  const pct = useMemo(() => clampPct(progressPct), [progressPct]);

  const cityText = useMemo(() => {
    if (cityLoading) return "Cargando ciudad...";
    if (cityLabel) return cityLabel;
    if (cityName && cityDepartment) return `${cityName}, ${cityDepartment}`;
    if (cityName) return cityName;
    return "Ciudad no asignada";
  }, [cityLoading, cityLabel, cityName, cityDepartment]);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="relative px-5 py-4 text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-black/10 blur-2xl" />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 shrink-0 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-base font-extrabold">
              {loading ? "…" : initials}
            </div>

            <div className="min-w-0">
              <div className="text-[15px] font-extrabold leading-tight truncate">
                {loading ? "Cargando…" : (fullName || "Conductor")}
              </div>
              <div className="text-[12px] text-white/90 truncate">
                {loading ? "—" : safeEmail}
              </div>

              <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-white/95 backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{cityText}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-extrabold tracking-wide uppercase shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.02]">
              <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full border ${lvl.iconWrap}`}>
                {lvl.icon}
              </span>
              <span className={`rounded-full border px-3 py-1 ${lvl.pill}`}>
                {lvl.label}
              </span>
            </div>

            <div className="w-[140px]">
              <div className="flex items-center justify-between text-[10px] text-white/90">
                <span className="font-semibold">Progreso</span>
                <span className="font-extrabold">{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-white/25">
                <div
                  className="h-1.5 rounded-full bg-white/90 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}