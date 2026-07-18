//app\(driver)\profile\academy\welcome\page.tsx
"use client";

import AcademyModulePage from "../components/AcademyModulePage";

export default function AcademyWelcomePage() {
  return (
    <AcademyModulePage
      title="Bienvenida KroniX"
      subtitle="Cultura, trato al cliente, puntualidad, presentación y compromiso con el servicio."
      icon="👋"
      videoTitle="Bienvenida a la cultura KroniX"
      videoUrl="https://www.youtube.com/embed/EGikbXGoZVc"
      version="academy-welcome-v2"
      trainingType="ACADEMY_WELCOME"
      checklist={[
        "Entiendo que KroniX busca servicios respetuosos, seguros y confiables.",
        "Me comprometo a tratar bien a clientes, comercios, otros trabajadores y al equipo KroniX.",
        "Entiendo la importancia de la puntualidad, la buena presentación y el cumplimiento de las instrucciones del servicio.",
      ]}
      quiz={[
        {
          id: "culture",
          question: "¿Qué busca KroniX en cada servicio?",
          options: [
            { id: "fast_only", label: "Solo rapidez." },
            {
              id: "quality",
              label: "Un servicio seguro, respetuoso y confiable.",
              correct: true,
            },
            { id: "tips", label: "Solo recibir pagos o propinas." },
          ],
        },
        {
          id: "client_treatment",
          question: "¿Cómo debe ser el trato al cliente?",
          options: [
            { id: "respect", label: "Respetuoso y profesional.", correct: true },
            { id: "depends", label: "Depende del cliente." },
            { id: "cold", label: "No importa el trato." },
          ],
        },
        {
          id: "presentation",
          question: "¿Por qué importa la presentación personal y de los elementos de trabajo?",
          options: [
            {
              id: "trust",
              label: "Porque genera confianza y refleja una buena imagen.",
              correct: true,
            },
            { id: "not_matter", label: "No importa." },
            { id: "only_uniform", label: "Solo importa si existe uniforme." },
          ],
        },
      ]}
    />
  );
}
