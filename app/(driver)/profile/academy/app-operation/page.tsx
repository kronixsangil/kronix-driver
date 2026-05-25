//app\(driver)\profile\academy\app-operation\page.tsx
"use client";

import AcademyModulePage from "../components/AcademyModulePage";

export default function AcademyAppOperationPage() {
  return (
    <AcademyModulePage
      title="Operación App"
      subtitle="Recogidas, entregas, pagos, soporte e incidentes."
      icon="📲"
      videoTitle="Cómo operar correctamente en KroniX Driver"
      videoUrl="https://www.youtube.com/embed/EGikbXGoZVc"
      checklist={[
        "Entiendo que debo actualizar correctamente los estados del pedido.",
        "Debo comunicar novedades por canales autorizados.",
        "Debo seguir instrucciones de recogida y entrega dentro de la app.",
      ]}
      quiz={[
        {
          id: "status",
          question: "¿Por qué es importante actualizar los estados del pedido?",
          options: [
            { id: "tracking", label: "Porque cliente, comercio y CTCC pueden hacer seguimiento.", correct: true },
            { id: "not_needed", label: "No es importante." },
            { id: "only_driver", label: "Solo le sirve al conductor." },
          ],
        },
        {
          id: "support",
          question: "¿Qué debe hacer ante una novedad operativa?",
          options: [
            { id: "report", label: "Reportarla por los canales autorizados.", correct: true },
            { id: "ignore", label: "Ignorarla." },
            { id: "personal_deal", label: "Resolverla por fuera de KroniX." },
          ],
        },
        {
          id: "delivery",
          question: "¿Qué debe cuidar durante recogida y entrega?",
          options: [
            { id: "instructions", label: "Productos, instrucciones, tiempos y comunicación.", correct: true },
            { id: "only_speed", label: "Solo la velocidad." },
            { id: "nothing", label: "Nada, solo llegar." },
          ],
        },
      ]}
    />
  );
}