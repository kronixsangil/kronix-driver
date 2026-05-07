// app/(driver)/profile/pay-info/page.tsx
"use client";

import { apiFetch } from "../../../../lib/apiFetch";
import { useEffect, useMemo, useState } from "react";
import { useDriverCity } from "../../components/DriverCityContext";

type AccountType = "AHORROS" | "CORRIENTE" | "BILLETERA";

type PaymentDTO = {
  id: string;
  bankName: string;
  accountType: AccountType;
  accountNumber: string;
  updatedAt: string;
};

type LoadState = "loading" | "ok" | "empty" | "error";
type EditMode = "view" | "edit";

type BankOption = {
  value: string;
  label: string;
  kind: "BANCO" | "BILLETERA";
  iconText: string;
};

const BANKS: BankOption[] = [
  { value: "Nequi", label: "Nequi", kind: "BILLETERA", iconText: "NQ" },
  { value: "Daviplata", label: "Daviplata", kind: "BILLETERA", iconText: "DP" },
  { value: "Bancolombia A la Mano", label: "Bancolombia A la Mano", kind: "BILLETERA", iconText: "BA" },

  { value: "Bancolombia", label: "Bancolombia", kind: "BANCO", iconText: "BC" },
  { value: "Davivienda", label: "Davivienda", kind: "BANCO", iconText: "DV" },
  { value: "Banco de Bogotá", label: "Banco de Bogotá", kind: "BANCO", iconText: "BB" },
  { value: "BBVA", label: "BBVA", kind: "BANCO", iconText: "BV" },
  { value: "Banco Popular", label: "Banco Popular", kind: "BANCO", iconText: "BP" },
  { value: "Banco de Occidente", label: "Banco de Occidente", kind: "BANCO", iconText: "BO" },
  { value: "Banco Caja Social", label: "Banco Caja Social", kind: "BANCO", iconText: "CS" },
  { value: "Banco Agrario", label: "Banco Agrario", kind: "BANCO", iconText: "AG" },
  { value: "Colpatria (Scotiabank)", label: "Colpatria (Scotiabank)", kind: "BANCO", iconText: "SC" },
  { value: "Banco AV Villas", label: "Banco AV Villas", kind: "BANCO", iconText: "AV" },
  { value: "Itaú", label: "Itaú", kind: "BANCO", iconText: "IT" },
  { value: "Bancoomeva", label: "Bancoomeva", kind: "BANCO", iconText: "BM" },
];

function fmtDate(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function maskAccount(n: string) {
  const clean = (n || "").replace(/\s+/g, "");
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `**** ${last4}`;
}

function bankIcon(option?: BankOption | null) {
  const t = option?.iconText || "CT";
  return (
    <div className="h-10 w-10 rounded-2xl border border-gray-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.10)] flex items-center justify-center">
      <div className="text-xs font-extrabold text-gray-700">{t}</div>
    </div>
  );
}

export default function DriverPayInfoPage() {
  const { cityLabel, cityName, loading: cityLoading } = useDriverCity();

  const [status, setStatus] = useState<LoadState>("loading");
  const [msg, setMsg] = useState<string>("");
  const [mode, setMode] = useState<EditMode>("view");

  const [data, setData] = useState<PaymentDTO | null>(null);

  const [bankName, setBankName] = useState<string>("");
  const [accountType, setAccountType] = useState<AccountType>("AHORROS");
  const [accountNumber, setAccountNumber] = useState<string>("");

  const [saving, setSaving] = useState<boolean>(false);

  const selectedBank = useMemo(() => {
    const found = BANKS.find((b) => b.value === bankName);
    return found ?? null;
  }, [bankName]);

  const cityText = cityLoading ? "Cargando ciudad..." : cityLabel || cityName || "Ciudad no asignada";

  useEffect(() => {
    let mounted = true;

    async function load() {
      setStatus("loading");
      setMsg("");
      setData(null);
      setMode("view");

      try {
        const res = (await apiFetch("/drivers/me/payment", { method: "GET", cache: "no-store" })) as any;
        const p = (res?.payment ?? res) as PaymentDTO | null;

        if (!mounted) return;

        if (!p || !p?.id) {
          setStatus("empty");
          setMsg("Aún no has configurado tu información de pago.");
          setMode("edit");
          return;
        }

        setData(p);
        setBankName(p.bankName || "");
        setAccountType((p.accountType as AccountType) || "AHORROS");
        setAccountNumber(p.accountNumber || "");
        setStatus("ok");
        setMode("view");
      } catch (e: any) {
        if (!mounted) return;
        setStatus("error");
        if (e?.status === 404) {
          setMsg("Falta crear en backend: GET /drivers/me/payment (y PATCH para actualizar).");
        } else {
          setMsg(e?.message || "No se pudo cargar.");
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const canSave = useMemo(() => {
    const bnOk = bankName.trim().length >= 2;
    const numOk = accountNumber.trim().length >= 6;
    return bnOk && numOk;
  }, [bankName, accountNumber]);

  async function save() {
    if (!canSave) return;

    setSaving(true);
    setMsg("");

    try {
      const payload = {
        bankName: bankName.trim(),
        accountType,
        accountNumber: accountNumber.trim(),
      };

      const res = (await apiFetch("/drivers/me/payment", {
        method: "PATCH",
        cache: "no-store",
        body: JSON.stringify(payload),
      })) as any;

      const p = (res?.payment ?? res) as PaymentDTO;

      setData(p);
      setStatus("ok");
      setMode("view");
      setMsg("Información de pago actualizada.");
    } catch (e: any) {
      setMsg(e?.message || "No se pudo guardar.");
      setStatus((prev) => (prev === "empty" ? "empty" : "error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full bg-slate-50 p-0">
      <div className="mx-auto w-full max-w-md px-0 pb-24 pt-0 space-y-4">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">Información de pago</h1>
          <p className="mt-1 text-sm text-gray-600">Configura tu método de pago para recibir tus pagos semanales.</p>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {cityText}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
          {status === "loading" ? <div className="text-sm text-gray-600">Cargando desde backend…</div> : null}
          {status === "error" ? <div className="text-sm text-red-700">{msg}</div> : null}

          {status !== "loading" && status !== "error" ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-gray-900">Estado</div>
                <div className="mt-1 text-xs text-gray-600">{data?.id ? "Configurado" : "Pendiente por configurar"}</div>
              </div>

              <span
                className={[
                  "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold border",
                  data?.id ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-900 border-amber-200",
                ].join(" ")}
              >
                {data?.id ? "OK" : "PENDIENTE"}
              </span>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Ciudad operativa</div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">{cityText}</div>
            <div className="mt-1 text-[12px] text-slate-600">
              Esta información de pago se usa en tu operación como conductor dentro del esquema multiciudad.
            </div>
          </div>

          {status === "ok" && data && mode === "view" ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
                <div className="flex items-start gap-3">
                  {bankIcon(BANKS.find((b) => b.value === data.bankName) ?? null)}

                  <div className="flex-1">
                    <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide">Cuenta</div>

                    <div className="mt-1 text-base font-extrabold text-gray-900">{data.bankName}</div>

                    <div className="mt-2 text-sm text-gray-800">
                      Tipo:{" "}
                      <span className="font-extrabold">
                        {data.accountType === "AHORROS"
                          ? "Ahorros"
                          : data.accountType === "CORRIENTE"
                            ? "Corriente"
                            : "Billetera"}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-gray-800">
                      Número: <span className="font-extrabold">{maskAccount(data.accountNumber)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMode("edit")}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(16,185,129,0.25)] active:scale-[0.99]"
              >
                Editar información
              </button>

              <div className="text-[11px] text-gray-500">
                Última actualización: {fmtDate(data.updatedAt)} · Usamos esta información únicamente para procesar tus pagos.
              </div>

              {msg ? <div className="text-sm text-emerald-700">{msg}</div> : null}
            </div>
          ) : null}

          {(status === "empty" || (status === "ok" && mode === "edit")) ? (
            <div className="mt-5 space-y-4">
              {status === "empty" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-xs font-extrabold text-amber-900 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Importante</span>
                  </div>
                  <div className="mt-2 text-xs text-amber-900 leading-relaxed">
                    Esta información es necesaria para que podamos enviarte tus pagos. Puedes actualizarla en cualquier momento.
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.10)] space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-gray-900">Entidad</label>

                  <div className="mt-2 flex items-center gap-3">
                    {bankIcon(selectedBank)}

                    <div className="flex-1">
                      <select
                        value={bankName}
                        onChange={(e) => {
                          const v = e.target.value;
                          setBankName(v);

                          const opt = BANKS.find((b) => b.value === v);
                          if (opt?.kind === "BILLETERA") setAccountType("BILLETERA");
                        }}
                        className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-emerald-400"
                      >
                        <option value="">Selecciona una entidad…</option>

                        <optgroup label="Billeteras">
                          {BANKS.filter((b) => b.kind === "BILLETERA").map((b) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </optgroup>

                        <optgroup label="Bancos">
                          {BANKS.filter((b) => b.kind === "BANCO").map((b) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      <div className="mt-2 text-[11px] text-gray-500">
                        Selecciona tu banco o billetera para recibir pagos.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-gray-900">Tipo</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as AccountType)}
                      className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-emerald-400"
                    >
                      <option value="AHORROS">Ahorros</option>
                      <option value="CORRIENTE">Corriente</option>
                      <option value="BILLETERA">Billetera</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-gray-900">Número</label>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Ej: 047900054231"
                      inputMode="numeric"
                      className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-gray-500">
                  Esta información se usa exclusivamente para procesar tus pagos semanales.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {status === "ok" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("view");
                      setMsg("");
                      if (data) {
                        setBankName(data.bankName || "");
                        setAccountType((data.accountType as AccountType) || "AHORROS");
                        setAccountNumber(data.accountNumber || "");
                      }
                    }}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-extrabold text-gray-800 shadow-[0_10px_24px_rgba(15,23,42,0.08)] active:scale-[0.99]"
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBankName("");
                      setAccountType("AHORROS");
                      setAccountNumber("");
                      setMsg("");
                    }}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm font-extrabold text-gray-800 shadow-[0_10px_24px_rgba(15,23,42,0.08)] active:scale-[0.99]"
                    disabled={saving}
                  >
                    Limpiar
                  </button>
                )}

                <button
                  type="button"
                  onClick={save}
                  disabled={!canSave || saving}
                  className={[
                    "w-full rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(16,185,129,0.25)] active:scale-[0.99]",
                    !canSave || saving ? "bg-emerald-300" : "bg-emerald-600 hover:bg-emerald-700",
                  ].join(" ")}
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>

              {msg ? (
                <div className={msg.includes("actualizada") ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{msg}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}