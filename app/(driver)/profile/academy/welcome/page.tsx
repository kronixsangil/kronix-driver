//app\(driver)\profile\academy\welcome\page.tsx
"use client";

import AcademyModulePage from "../components/AcademyModulePage";

export default function AcademyWelcomePage() {
  return (
    <AcademyModulePage
      title="Bienvenida KroniX"
      subtitle="Cultura, trato al cliente, puntualidad y presentación."
      icon="👋"
      videoTitle="Bienvenida a la cultura KroniX"
      videoUrl="https://www.youtube.com/embed/EGikbXGoZVc"
      checklist={[
        "Entiendo que KroniX busca un servicio respetuoso, seguro y confiable.",
        "Me comprometo a tratar bien a clientes, comercios y equipo KroniX.",
        "Entiendo la importancia de la puntualidad y la buena presentación.",
      ]}
      quiz={[
        {
          id: "culture",
          question: "¿Qué busca KroniX en cada servicio?",
          options: [
            { id: "fast_only", label: "Solo rapidez." },
            { id: "quality", label: "Servicio seguro, respetuoso y confiable.", correct: true },
            { id: "tips", label: "Solo recibir propinas." },
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
          question: "¿Por qué importa la presentación personal?",
          options: [
            { id: "trust", label: "Porque genera confianza y buena imagen.", correct: true },
            { id: "not_matter", label: "No importa." },
            { id: "only_uniform", label: "Solo importa si hay uniforme." },
          ],
        },
      ]}
    />
  );
}