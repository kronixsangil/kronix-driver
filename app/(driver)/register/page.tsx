//app\(driver)\register\page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listPublicCities,
  listPublicWorkerServices,
  registerDriver,
  type PublicCity,
  type PublicDynamicService,
} from "../../../lib/driverRegistration";

function inputClass() {
  return "mt-2 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-[15px] font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-300 focus:bg-white";
}

function serviceIcon(service: PublicDynamicService) {
  return service.icon || "⚙️";
}

function requiresVehicle(workerTypeKey: string) {
  const key = String(workerTypeKey || "").toUpperCase();
  return ["TAXI", "MOTORCARGO", "CAMIONERO", "CAR", "TRUCK"].includes(key);
}

export default function DriverRegisterPage() {
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [services, setServices] = useState<PublicDynamicService[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    documentId: "",
    cityId: "",
    password: "",
    confirmPassword: "",
    plate: "",
    brand: "",
    model: "",
    color: "",
    serviceKeys: [] as string[],
    termsAccepted: false,
  });

  useEffect(() => {
    let alive = true;

    listPublicCities()
      .then((items) => {
        if (!alive) return;
        setCities(items);
        if (items.length === 1) {
          setForm((current) => ({ ...current, cityId: items[0].id }));
        }
      })
      .catch(() => {
        if (alive) setError("No pudimos cargar las ciudades disponibles.");
      })
      .finally(() => {
        if (alive) setCitiesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const city = cities.find((item) => item.id === form.cityId);

    if (!city?.slug) {
      setServices([]);
      setForm((current) => ({ ...current, serviceKeys: [] }));
      return;
    }

    let alive = true;
    setServicesLoading(true);
    setError(null);

    listPublicWorkerServices(city.slug)
      .then((items) => {
        if (!alive) return;
        setServices(items);
        setForm((current) => ({
          ...current,
          serviceKeys: current.serviceKeys.filter((key) =>
            items.some((service) => service.serviceKey === key)
          ),
        }));
      })
      .catch(() => {
        if (!alive) return;
        setServices([]);
        setError("No pudimos cargar los servicios disponibles para esta ciudad.");
      })
      .finally(() => {
        if (alive) setServicesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cities, form.cityId]);

  const selectedServices = useMemo(
    () => services.filter((service) => form.serviceKeys.includes(service.serviceKey)),
    [services, form.serviceKeys]
  );

  const hasVehicleService = useMemo(
    () => selectedServices.some((service) => requiresVehicle(service.workerTypeKey)),
    [selectedServices]
  );

  const canSubmit =
    form.name.trim().length >= 3 &&
    form.phone.trim().length >= 7 &&
    form.documentId.trim().length >= 5 &&
    Boolean(form.cityId) &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword &&
    form.serviceKeys.length > 0 &&
    form.termsAccepted &&
    !submitting;

  const update = (key: keyof typeof form, value: string | boolean | string[]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleService = (key: string) => {
    setForm((current) => ({
      ...current,
      serviceKeys: current.serviceKeys.includes(key)
        ? current.serviceKeys.filter((item) => item !== key)
        : [...current.serviceKeys, key],
    }));
  };

  const submit = async () => {
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      const out = await registerDriver({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        documentId: form.documentId.trim(),
        cityId: form.cityId,
        password: form.password,
        plate: form.plate.trim() || undefined,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        color: form.color.trim() || undefined,
        serviceKeys: form.serviceKeys,
        termsAccepted: true,
        termsVersion: "worker-v1.0",
      });
      setSuccess(out.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setError(String(e?.message ?? "No pudimos completar el registro."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="px-4 py-8">
        <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl">
          <div className="bg-gradient-to-br from-emerald-600 to-blue-700 px-6 py-10 text-center text-white">
            <div className="text-5xl">✅</div>
            <h1 className="mt-4 text-2xl font-black">¡Registro recibido!</h1>
            <p className="mt-2 text-sm text-white/90">Tu cuenta quedó pendiente de revisión.</p>
          </div>
          <div className="p-6">
            <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-900">
              {success}
            </p>
            <div className="mt-5 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
              <strong className="text-slate-900">Siguiente paso:</strong> envía tu documento,
              licencia y documentos del vehículo al WhatsApp Business de KRONIX. Cuando el equipo
              termine la validación, tu cuenta será activada.
            </div>
            <Link href="/login" className="mt-6 flex w-full items-center justify-center rounded-2xl bg-blue-600 py-3.5 text-sm font-extrabold text-white hover:bg-blue-700">
              VOLVER AL INICIO DE SESIÓN
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-12">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="relative overflow-hidden bg-blue-900 px-6 py-4 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_40%)]" />
          <div className="relative z-10">
            <div className="text-2xl font-black">Trabaja con KRONIX</div>
            <p className="mt-2 max-w-lg text-sm leading-6 text-white/90">
              Completa tus datos. Tu solicitud será revisada antes de habilitarte para recibir servicios.
            </p>
          </div>
        </div>

        <div className="space-y-7 p-4 sm:p-6">
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

          <section>
            <h2 className="text-lg font-black text-slate-900">1. Datos personales</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 md:col-span-2">Nombre completo<input className={inputClass()} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Como aparece en tu documento" /></label>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Teléfono<input className={inputClass()} value={form.phone} onChange={(e) => update("phone", e.target.value)} inputMode="tel" placeholder="300 000 0000" /></label>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Correo electrónico<input className={inputClass()} value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="Opcional" /></label>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Documento de identidad<input className={inputClass()} value={form.documentId} onChange={(e) => update("documentId", e.target.value)} inputMode="numeric" placeholder="Número sin puntos" /></label>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Ciudad
                <select className={inputClass()} value={form.cityId} onChange={(e) => update("cityId", e.target.value)} disabled={citiesLoading}>
                  <option value="">{citiesLoading ? "Cargando ciudades..." : "Selecciona tu ciudad"}</option>
                  {cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.department}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900">2. ¿En qué quieres trabajar?</h2>
            <p className="mt-1 text-sm text-slate-500">Los servicios se cargan automáticamente desde el catálogo activo de tu ciudad.</p>

            {servicesLoading ? (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-700">Cargando servicios disponibles...</div>
            ) : !form.cityId ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Selecciona primero tu ciudad.</div>
            ) : services.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">No hay servicios activos disponibles en esta ciudad.</div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {services.map((service) => {
                  const selected = form.serviceKeys.includes(service.serviceKey);
                  return (
                    <button
                      key={service.id || service.serviceKey}
                      type="button"
                      onClick={() => toggleService(service.serviceKey)}
                      className={`rounded-2xl border p-4 text-left transition ${selected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{serviceIcon(service)}</span>
                        <div>
                          <div className="font-extrabold text-slate-900">{service.shortName || service.name}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-500">{service.description || `Trabaja como ${service.workerLabel}.`}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {hasVehicleService ? (
            <section>
              <h2 className="text-lg font-black text-slate-900">3. Vehículo</h2>
              <p className="mt-1 text-sm text-slate-500">Completa los datos del vehículo que usarás.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Placa<input className={inputClass()} value={form.plate} onChange={(e) => update("plate", e.target.value.toUpperCase())} placeholder="ABC123" /></label>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Marca<input className={inputClass()} value={form.brand} onChange={(e) => update("brand", e.target.value)} placeholder="Marca" /></label>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Modelo<input className={inputClass()} value={form.model} onChange={(e) => update("model", e.target.value)} placeholder="Modelo o año" /></label>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Color<input className={inputClass()} value={form.color} onChange={(e) => update("color", e.target.value)} placeholder="Color" /></label>
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="text-lg font-black text-slate-900">{hasVehicleService ? "4" : "3"}. Crea tu contraseña</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Contraseña<input className={inputClass()} value={form.password} onChange={(e) => update("password", e.target.value)} type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" /></label>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Confirmar contraseña<input className={inputClass()} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} type="password" autoComplete="new-password" placeholder="Repite la contraseña" /></label>
            </div>
            <p className="mt-2 text-xs text-slate-500">Debe contener mínimo 8 caracteres y combinar letras y números.</p>
          </section>

          <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <input type="checkbox" checked={form.termsAccepted} onChange={(e) => update("termsAccepted", e.target.checked)} className="mt-1 h-4 w-4" />
            <span>Acepto los términos, la política de privacidad y autorizo a KRONIX a validar la información suministrada.</span>
          </label>

          <button type="button" disabled={!canSubmit} onClick={submit} className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-extrabold text-white transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? "ENVIANDO SOLICITUD..." : "CREAR SOLICITUD"}
          </button>

          <Link href="/login" className="block text-center text-sm font-bold text-blue-600 hover:underline">Ya tengo cuenta · Iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
