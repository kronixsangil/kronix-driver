//app\(driver)\profile\academy\app-operation\page.tsx
"use client";

import AcademyModulePage from "../components/AcademyModulePage";

export default function AcademyAppOperationPage() {
  return (
    <AcademyModulePage
      title="Operación App"
      subtitle="Estados del servicio, instrucciones, pagos, soporte, comunicación e incidentes."
      icon="📲"
      videoTitle="Cómo operar correctamente en KroniX"
      videoUrl="https://www.youtube.com/embed/EGikbXGoZVc"
      version="academy-app-operation-v2"
      trainingType="ACADEMY_APP_OPERATION"
      checklist={[
        "Entiendo que debo actualizar correctamente los estados del servicio.",
        "Debo comunicar novedades por los canales autorizados.",
        "Debo seguir las instrucciones visibles en la app según el Servicio Dinámico que esté realizando.",
      ]}
      quiz={[
        {
          id: "status",
          question: "¿Por qué es importante actualizar los estados del servicio?",
          options: [
            {
              id: "tracking",
              label: "Porque el cliente y KroniX pueden conocer el avance real del servicio.",
              correct: true,
            },
            { id: "not_needed", label: "No es importante." },
            { id: "only_driver", label: "Solo le sirve al trabajador." },
          ],
        },
        {
          id: "support",
          question: "¿Qué debe hacer ante una novedad operativa?",
          options: [
            {
              id: "report",
              label: "Reportarla oportunamente por los canales autorizados.",
              correct: true,
            },
            { id: "ignore", label: "Ignorarla." },
            { id: "personal_deal", label: "Ocultarla y resolverla por fuera de KroniX." },
          ],
        },
        {
          id: "delivery",
          question: "¿Qué debe cuidar durante la ejecución de un servicio?",
          options: [
            {
              id: "instructions",
              label: "La seguridad, las instrucciones, los tiempos, los bienes involucrados y la comunicación.",
              correct: true,
            },
            { id: "only_speed", label: "Solo la velocidad." },
            { id: "nothing", label: "Nada; únicamente debe marcarlo como finalizado." },
          ],
        },
      ]}
    />
  );
}
