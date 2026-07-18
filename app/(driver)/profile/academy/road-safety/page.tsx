//app\(driver)\profile\academy\road-safety\page.tsx
"use client";

import AcademyModulePage from "../components/AcademyModulePage";

export default function AcademyRoadSafetyPage() {
  return (
    <AcademyModulePage
      title="Movilidad y Seguridad Vial"
      subtitle="Desplazamientos seguros, prevención de accidentes, zonas de riesgo y conducción responsable cuando el servicio requiera vehículo."
      icon="🛵"
      videoTitle="Movilidad y seguridad vial para trabajadores KroniX"
      videoUrl="https://www.youtube.com/embed/_ckcWtvlHO0"
      version="academy-road-safety-v2"
      trainingType="ACADEMY_ROAD_SAFETY"
      checklist={[
        "Entiendo que debo cumplir las normas de tránsito durante cualquier desplazamiento relacionado con un servicio.",
        "Si conduzco un vehículo, no debo manipular el celular mientras está en movimiento.",
        "Debo reportar accidentes, incidentes o situaciones de riesgo a KroniX oportunamente.",
      ]}
      quiz={[
        {
          id: "traffic_rules",
          question: "¿Qué debe priorizar un trabajador durante sus desplazamientos?",
          options: [
            { id: "speed", label: "La rapidez por encima de todo." },
            {
              id: "safety",
              label: "La seguridad y el cumplimiento de las normas de tránsito.",
              correct: true,
            },
            { id: "shortcut", label: "Tomar cualquier atajo disponible." },
          ],
        },
        {
          id: "phone",
          question: "Si está conduciendo, ¿qué debe hacer antes de revisar el celular?",
          options: [
            {
              id: "stop_safe",
              label: "Detenerse en un lugar seguro.",
              correct: true,
            },
            { id: "drive_phone", label: "Revisarlo mientras conduce." },
            { id: "ignore_traffic", label: "Bajar la velocidad y mirar rápidamente." },
          ],
        },
        {
          id: "accident",
          question: "Si ocurre un accidente o incidente durante un servicio, ¿qué debe hacer?",
          options: [
            { id: "hide", label: "Ocultarlo si puede continuar." },
            {
              id: "report",
              label: "Priorizar la seguridad, reportarlo a KroniX y seguir el protocolo correspondiente.",
              correct: true,
            },
            { id: "finish_first", label: "Terminar el servicio antes de reportarlo, sin importar el riesgo." },
          ],
        },
      ]}
    />
  );
}
