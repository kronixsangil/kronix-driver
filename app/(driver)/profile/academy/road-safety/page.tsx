//app\(driver)\profile\academy\road-safety\page.tsx
"use client";

import AcademyModulePage from "../components/AcademyModulePage";

export default function AcademyRoadSafetyPage() {
  return (
    <AcademyModulePage
      title="Seguridad Vial"
      subtitle="Conducción segura, accidentes, zonas peligrosas y manejo defensivo."
      icon="🛵"
      videoTitle="Seguridad vial para conductores KroniX"
      videoUrl="https://www.youtube.com/embed/EGikbXGoZVc"
      checklist={[
        "Entiendo que debo cumplir las normas de tránsito.",
        "No debo manipular el celular mientras conduzco.",
        "Debo reportar accidentes o incidentes a KroniX oportunamente.",
      ]}
      quiz={[
        {
          id: "traffic_rules",
          question: "¿Qué debe priorizar el conductor?",
          options: [
            { id: "speed", label: "La rapidez por encima de todo." },
            { id: "safety", label: "La seguridad y las normas de tránsito.", correct: true },
            { id: "shortcut", label: "Tomar cualquier atajo." },
          ],
        },
        {
          id: "phone",
          question: "¿Qué debe hacer antes de revisar el celular?",
          options: [
            { id: "stop_safe", label: "Detenerse en un lugar seguro.", correct: true },
            { id: "drive_phone", label: "Revisarlo mientras conduce." },
            { id: "ignore_traffic", label: "Bajar velocidad y mirar rápido." },
          ],
        },
        {
          id: "accident",
          question: "Si ocurre un accidente, ¿qué debe hacer?",
          options: [
            { id: "hide", label: "Ocultarlo si puede continuar." },
            { id: "report", label: "Reportarlo a KroniX y seguir el protocolo.", correct: true },
            { id: "finish_first", label: "Primero terminar el pedido siempre." },
          ],
        },
      ]}
    />
  );
}