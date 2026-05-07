// app/(driver)/lib/openMaps.ts

/**
 * Abre Google Maps con la mejor precisión posible.
 * - Si recibe string: lo trata como dirección y fuerza contexto geográfico.
 * - Si recibe lat/lng: navega por coordenadas.
 *
 * Funciona para:
 * - Direcciones de cliente
 * - Direcciones de establecimientos (pickups)
 */
export function openMapsNavigation(
  latOrAddress: number | string,
  lng?: number,
  label?: string
) {
  let destination = "";

  if (typeof latOrAddress === "string") {
    // ✅ Normalizar texto
    const normalized = latOrAddress
      .replace(/\s+/g, " ")
      .trim();

    // ✅ Forzar contexto geográfico (clave para precisión en Colombia)
    destination = encodeURIComponent(
      `${normalized}, San Gil, Santander, Colombia`
    );
  } else {
    // ✅ Navegación por coordenadas (fallback ultra preciso)
    destination = `${latOrAddress},${lng}`;
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

