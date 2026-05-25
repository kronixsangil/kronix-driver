//app\(driver)\profile\academy\fraud-prevention\page.tsx
"use client";

import AcademyModulePage from "../components/AcademyModulePage";

export default function AcademyFraudPreventionPage() {
  return (
    <AcademyModulePage
      title="Antifraude"
      subtitle="GPS falso, cuentas compartidas, robo, fraude y suplantación."
      icon="🔐"
      videoTitle="Prevención de fraude en KroniX"
      videoUrl="https://www.youtube.com/embed/dykJBcpnHVE"
      checklist={[
        "Entiendo que mi cuenta es personal e intransferible.",
        "Entiendo que GPS falso, pedidos falsos o manipulación de pagos están prohibidos.",
        "Entiendo que el fraude puede generar bloqueo y acciones legales.",
      ]}
      quiz={[
        {
          id: "account",
          question: "¿Está permitido compartir la cuenta?",
          options: [
            { id: "yes_family", label: "Sí, con familiares." },
            { id: "no", label: "No, es personal e intransferible.", correct: true },
            { id: "sometimes", label: "Solo cuando estoy ocupado." },
          ],
        },
        {
          id: "gps",
          question: "¿Está permitido usar GPS falso?",
          options: [
            { id: "never", label: "No, está prohibido.", correct: true },
            { id: "night", label: "Sí, de noche." },
            { id: "fast", label: "Sí, si entrego rápido." },
          ],
        },
        {
          id: "fraud",
          question: "¿Qué puede pasar si hay fraude?",
          options: [
            { id: "nothing", label: "Nada." },
            { id: "block", label: "Bloqueo, revisión de pagos y acciones legales.", correct: true },
            { id: "bonus", label: "Puede recibir bonos." },
          ],
        },
      ]}
    />
  );
}
