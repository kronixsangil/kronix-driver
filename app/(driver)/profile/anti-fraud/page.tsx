//app\(driver)\profile\anti-fraud\page.tsx
"use client";

import DriverTrainingDocumentPage from "../components/DriverTrainingDocumentPage";
import {
  DRIVER_ANTI_FRAUD_LAST_UPDATED,
  DRIVER_ANTI_FRAUD_TEXT,
  DRIVER_ANTI_FRAUD_TITLE,
  DRIVER_ANTI_FRAUD_VERSION,
} from "../../legal/driverAntiFraud";

const QUIZ = [
  {
    id: "shared_account",
    question: "¿Está permitido compartir la cuenta de conductor con otra persona?",
    options: [
      { id: "allowed_family", label: "Sí, si es familiar o persona de confianza." },
      { id: "never_allowed", label: "No, la cuenta es personal e intransferible." },
      { id: "allowed_busy", label: "Sí, si el conductor está ocupado." },
    ],
  },
  {
    id: "fake_orders",
    question: "¿Qué dice KroniX sobre pedidos falsos o simulados?",
    options: [
      { id: "prohibited", label: "Están prohibidos y pueden generar bloqueo." },
      { id: "allowed_bonus", label: "Se permiten si ayudan a ganar bonos." },
      { id: "allowed_test", label: "Siempre se permiten como prueba personal." },
    ],
  },
  {
    id: "payment_manipulation",
    question: "Manipular pagos, comprobantes o saldos se considera:",
    options: [
      { id: "normal", label: "Una práctica normal si nadie reclama." },
      { id: "fraud", label: "Fraude y conducta prohibida." },
      { id: "negotiation", label: "Una negociación privada con el cliente." },
    ],
  },
  {
    id: "gps_fake",
    question: "¿Está permitido usar GPS falso o manipular la ubicación?",
    options: [
      { id: "only_night", label: "Sí, solo de noche." },
      { id: "prohibited", label: "No, está prohibido." },
      { id: "allowed_if_fast", label: "Sí, si el pedido se entrega rápido." },
    ],
  },
  {
    id: "identity_impersonation",
    question: "¿Está permitida la suplantación de identidad?",
    options: [
      { id: "not_allowed", label: "No, está prohibida." },
      { id: "allowed_with_permission", label: "Sí, si la otra persona da permiso." },
      { id: "allowed_temporarily", label: "Sí, temporalmente." },
    ],
  },
];

export default function AntiFraudPage() {
  return (
    <DriverTrainingDocumentPage
      title={DRIVER_ANTI_FRAUD_TITLE}
      version={DRIVER_ANTI_FRAUD_VERSION}
      lastUpdated={DRIVER_ANTI_FRAUD_LAST_UPDATED}
      text={DRIVER_ANTI_FRAUD_TEXT}
      trainingType="ANTI_FRAUD"
      documentType="DRIVER_ANTI_FRAUD_POLICY"
      quiz={QUIZ}
    />
  );
}