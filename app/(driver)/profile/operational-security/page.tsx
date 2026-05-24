//app\(driver)\profile\operational-security\page.tsx
"use client";

import DriverTrainingDocumentPage from "../components/DriverTrainingDocumentPage";
import {
  DRIVER_OPERATIONAL_SECURITY_LAST_UPDATED,
  DRIVER_OPERATIONAL_SECURITY_TEXT,
  DRIVER_OPERATIONAL_SECURITY_TITLE,
  DRIVER_OPERATIONAL_SECURITY_VERSION,
} from "../../legal/driverOperationalSecurity";

const QUIZ = [
  {
    id: "respectful_treatment",
    question: "¿Cómo debe tratar el conductor a clientes, comercios y personal KroniX?",
    options: [
      { id: "depends_on_client", label: "Depende de cómo lo trate el cliente." },
      { id: "no_discrimination", label: "Con respeto, sin discriminación ni lenguaje ofensivo." },
      { id: "only_if_tip", label: "Con buen trato solo si hay propina." },
    ],
  },
  {
    id: "road_safety",
    question: "¿Cuál es la conducta correcta frente a la seguridad vial?",
    options: [
      { id: "fast_delivery_first", label: "Priorizar la rapidez por encima de la seguridad." },
      { id: "safe_driving", label: "Cumplir normas de tránsito y conducir prudentemente." },
      { id: "phone_while_driving", label: "Usar el celular mientras conduce si el pedido es urgente." },
    ],
  },
  {
    id: "customer_incident",
    question: "Si ocurre un incidente durante un servicio, ¿qué debe hacer el conductor?",
    options: [
      { id: "ignore_it", label: "Ignorarlo si el pedido pudo entregarse." },
      { id: "report_to_kronix", label: "Reportarlo a KroniX tan pronto como sea posible." },
      { id: "hide_information", label: "Ocultar información para evitar problemas." },
    ],
  },
  {
    id: "hygiene_presentation",
    question: "¿Qué se espera sobre higiene y presentación?",
    options: [
      { id: "not_important", label: "No importa mientras entregue rápido." },
      { id: "clean_and_respectful", label: "Presentación limpia y elementos de transporte en buen estado." },
      { id: "only_vehicle", label: "Solo importa que la moto funcione." },
    ],
  },
  {
    id: "punctuality",
    question: "¿Qué debe hacer el conductor al aceptar un servicio?",
    options: [
      { id: "arrive_on_time", label: "Actuar con puntualidad, compromiso y reportar novedades." },
      { id: "wait_until_later", label: "Esperar hasta que tenga tiempo libre." },
      { id: "cancel_without_reason", label: "Cancelar sin explicación si cambia de opinión." },
    ],
  },
];

export default function OperationalSecurityPage() {
  return (
    <DriverTrainingDocumentPage
      title={DRIVER_OPERATIONAL_SECURITY_TITLE}
      version={DRIVER_OPERATIONAL_SECURITY_VERSION}
      lastUpdated={DRIVER_OPERATIONAL_SECURITY_LAST_UPDATED}
      text={DRIVER_OPERATIONAL_SECURITY_TEXT}
      trainingType="OPERATIONAL_SECURITY"
      documentType="DRIVER_OPERATIONAL_SECURITY_MANUAL"
      quiz={QUIZ}
    />
  );
}