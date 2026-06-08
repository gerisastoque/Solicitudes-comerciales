import { MOCK_LDP_PROPOSALS, type LdpProposal } from "./ldp-data";
import type { Urgency } from "./mock-data";

/**
 * Profesor logueado (mock).
 * Reutilizamos un profesor ya existente en los datos para no romper flujos.
 */
export const CURRENT_PROFESSOR = {
  name: "Dr. Ricardo Mejía",
  email: "ricardo.mejia@icesi.edu.co",
} as const;

/** Estados visibles para el Profesor (derivados del flujo LDP existente). */
export type ProfStatus = "nueva" | "elaboracion" | "enviada" | "ajuste" | "rechazada";

export const PROF_STATUS_META: Record<ProfStatus, { label: string; tone: string; dot: string }> = {
  nueva: {
    label: "Nueva",
    tone: "bg-accent/10 text-accent border-accent/20",
    dot: "bg-accent",
  },
  elaboracion: {
    label: "En elaboración",
    tone: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30",
    dot: "bg-cyan-500",
  },
  enviada: {
    label: "Enviada",
    tone: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  ajuste: {
    label: "En ajuste",
    tone: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  rechazada: {
    label: "Rechazada por cliente",
    tone: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
};

export const PROF_COLUMNS: ProfStatus[] = ["nueva", "elaboracion", "enviada", "ajuste", "rechazada"];

/**
 * Set local de propuestas que el profesor ya empezó a elaborar.
 * Las que no estén aquí y estén en "proceso" se muestran como "nueva".
 */
export const STARTED_BY_PROFESSOR = new Set<string>([]);

/** Datos extra de propuestas asignadas al profesor logueado para enriquecer la demo.
 *  No se agregan al pool global del LDP para no afectar sus tableros.
 */
const _today = new Date();
const _addDays = (n: number) => {
  const d = new Date(_today);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const EXTRA_PROFESSOR_PROPOSALS: LdpProposal[] = [
  {
    id: "PROP-2026-0301",
    title: "Diplomado de innovación abierta",
    company: "Quala",
    companyLogo: "https://logo.clearbit.com/quala.com.co",
    applicant: "Andrea Rivas",
    type: "Capacitación",
    createdAt: _addDays(-2),
    deadline: _addDays(6),
    status: "proceso",
    urgency: "alta" as Urgency,
    kam: "Andrea Martínez",
    productLeader: "Jhon Doe",
    professor: CURRENT_PROFESSOR.name,
    nodes: ["Liderazgo y Estrategia"],
  },
  {
    id: "PROP-2026-0302",
    title: "Programa de habilidades de negociación",
    company: "Corona",
    companyLogo: "https://logo.clearbit.com/corona.co",
    applicant: "Mateo Salazar",
    type: "Capacitación",
    createdAt: _addDays(-6),
    deadline: _addDays(3),
    status: "proceso",
    urgency: "media" as Urgency,
    kam: "Carlos Riveros",
    productLeader: "Jhon Doe",
    professor: CURRENT_PROFESSOR.name,
    nodes: ["Liderazgo y Estrategia"],
  },
  {
    id: "PROP-2026-0303",
    title: "Consultoría en transformación cultural",
    company: "Tigo",
    companyLogo: "https://logo.clearbit.com/tigo.com.co",
    applicant: "Lina Mejía",
    type: "Consultoría",
    createdAt: _addDays(-9),
    deadline: _addDays(-1),
    status: "ajustes",
    urgency: "alta" as Urgency,
    kam: "Diana Salcedo",
    productLeader: "Jhon Doe",
    professor: CURRENT_PROFESSOR.name,
    nodes: ["Liderazgo y Estrategia"],
    adjustmentOwner: "profesor",
    adjustmentBy: "Jhon Doe",
    adjustmentAt: _addDays(-1),
    adjustmentReason:
      "Ajustar los entregables del módulo 2 y agregar un caso real del sector telecomunicaciones antes de continuar con el costeo.",
    totalCost: 38500000,
  },
  {
    id: "PROP-2026-0304",
    title: "Taller de ventas consultivas B2B",
    company: "Movistar",
    companyLogo: "https://logo.clearbit.com/movistar.co",
    applicant: "Paula Herrera",
    type: "Capacitación",
    createdAt: _addDays(-20),
    deadline: _addDays(-5),
    status: "rechazada",
    urgency: "media" as Urgency,
    kam: "Felipe Ortiz",
    productLeader: "Jhon Doe",
    professor: CURRENT_PROFESSOR.name,
    nodes: ["Liderazgo y Estrategia"],
    rejectionReason:
      "El cliente decidió no continuar con la propuesta tras revisión interna de presupuesto. Prefieren retomar el proceso en el siguiente trimestre con un alcance más acotado.",
    rejectedBy: "Movistar",
    rejectedAt: _addDays(-3),
  },
];

// Marcamos por defecto la primera como "elaboracion" para mostrar variedad en la demo.
STARTED_BY_PROFESSOR.add("PROP-2026-0301");
// Una propuesta del pool LDP ya asignada a Ricardo, en "proceso" → mostrarla como "nueva".
// (PROP-2026-0211 está asignada a Dr. Ricardo Mejía y queda como "nueva" por defecto.)

export function getProfStatus(p: LdpProposal): ProfStatus | null {
  if (p.status === "proceso") return STARTED_BY_PROFESSOR.has(p.id) ? "elaboracion" : "nueva";
  if (p.status === "costeo" || p.status === "entregada") return "enviada";
  if (p.status === "ajustes" && p.adjustmentOwner === "profesor") return "ajuste";
  if (p.status === "rechazada") return "rechazada";
  return null;
}

/** Devuelve todas las propuestas visibles para el profesor logueado. */
export function getProfessorProposals(): LdpProposal[] {
  const fromLdp = MOCK_LDP_PROPOSALS.filter(
    (p) => p.professor === CURRENT_PROFESSOR.name && getProfStatus(p) !== null,
  );
  const extras = EXTRA_PROFESSOR_PROPOSALS.filter((p) => getProfStatus(p) !== null);
  return [...extras, ...fromLdp];
}

export function findProfessorProposal(id: string): LdpProposal | undefined {
  return (
    EXTRA_PROFESSOR_PROPOSALS.find((p) => p.id === id) ??
    MOCK_LDP_PROPOSALS.find((p) => p.id === id && p.professor === CURRENT_PROFESSOR.name)
  );
}
