import { getDeadlineBucket, PROFESSORS, type Urgency, type AdjustmentOwner } from "./mock-data";

export type LdpStatus = "nuevo" | "proceso" | "costeo" | "aprobacion" | "aprobada" | "entregada" | "ajustes" | "rechazada";
export type { AdjustmentOwner };

export interface LdpProposal {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  applicant: string;
  type: "Capacitación" | "Consultoría" | "Mentoría";
  createdAt: string;
  deadline?: string;
  status: LdpStatus;
  urgency: Urgency;
  kam: string;
  productLeader: string;
  professor?: string;
  professorEmail?: string;
  /** Centro(s) académico(s) encargado(s) de la propuesta. */
  nodes?: string[];
  /** Costeo guardado por el LDP (no se comparte con el KAM). */
  costing?: {
    doctorateHours: number;
    monitorHours: number;
    externalAdvisor: "si" | "no";
    files: { name: string; size: string }[];
  };
  /** Costo total del programa (COP) que se envía al KAM. */
  totalCost?: number;
  /** Motivo del rechazo del cliente cuando status === "rechazada". */
  rejectionReason?: string;
  /** Quien rechazó (cliente). */
  rejectedBy?: string;
  rejectedAt?: string;
  /** Motivo de ajuste interno cuando status === "ajustes". */
  adjustmentReason?: string;
  adjustmentBy?: string;
  adjustmentAt?: string;
  /** Rol con la acción pendiente durante un ajuste interno. */
  adjustmentOwner?: AdjustmentOwner;
}

export const LDP_STATUS_META: Record<LdpStatus, { label: string; tone: string; dot: string }> = {
  nuevo: { label: "Por asignar profesor", tone: "bg-accent/10 text-accent border-accent/20", dot: "bg-accent" },
  proceso: {
    label: "Propuesta en elaboración",
    tone: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30",
    dot: "bg-cyan-500",
  },
  costeo: { label: "Lista para costeo", tone: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  aprobacion: {
    label: "En aprobación",
    tone: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
    dot: "bg-violet-500",
  },
  aprobada: {
    label: "Aprobada",
    tone: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  entregada: { label: "Entregada a KAM", tone: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  ajustes: { label: "En ajustes", tone: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  rechazada: { label: "Rechazada por cliente", tone: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive" },
};

export const LDP_COLUMNS: LdpStatus[] = ["nuevo", "proceso", "costeo", "aprobacion", "aprobada", "entregada", "ajustes", "rechazada"];

/** Directorio de profesores reutilizando los nombres del mock KAM. */
const _slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^(dr|dra)\.?\s+/, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");

export const PROFESSOR_DIRECTORY: Array<{ name: string; email: string }> = PROFESSORS.map((name) => ({
  name,
  email: `${_slug(name)}@icesi.edu.co`,
}));

const _today = new Date();
const _addDays = (days: number) => {
  const d = new Date(_today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const _extraNuevos: LdpProposal[] = Array.from({ length: 10 }).map((_, i) => {
  const n = 220 + i;
  const companies = [
    { name: "Alpina", logo: "https://logo.clearbit.com/alpina.com" },
    { name: "ISA", logo: "https://logo.clearbit.com/isa.co" },
    { name: "Ecopetrol", logo: "https://logo.clearbit.com/ecopetrol.com.co" },
    { name: "Avianca", logo: "https://logo.clearbit.com/avianca.com" },
    { name: "Falabella", logo: "https://logo.clearbit.com/falabella.com.co" },
    { name: "Claro", logo: "https://logo.clearbit.com/claro.com.co" },
    { name: "Tigo", logo: "https://logo.clearbit.com/tigo.com.co" },
    { name: "Movistar", logo: "https://logo.clearbit.com/movistar.co" },
    { name: "Quala", logo: "https://logo.clearbit.com/quala.com.co" },
    { name: "Corona", logo: "https://logo.clearbit.com/corona.co" },
  ];
  const types: LdpProposal["type"][] = ["Capacitación", "Consultoría", "Mentoría"];
  const kams = ["Andrea Martínez", "Carlos Riveros", "Diana Salcedo", "Felipe Ortiz"];
  const c = companies[i];
  return {
    id: `PROP-2026-0${n}`,
    title: `Propuesta de prueba ${i + 1} — ${c.name}`,
    company: c.name,
    companyLogo: c.logo,
    applicant: ["Laura Gómez", "Mateo Ríos", "Sofía Vargas", "Andrés Niño", "Valentina Cruz", "Tomás Pardo", "Isabela Mora", "Sebastián León", "Camila Soto", "Daniel Páez"][i],
    type: types[i % 3],
    createdAt: _addDays(-(i + 1)),
    deadline: _addDays((i % 4) * 2 + 1),
    status: "nuevo",
    urgency: (["alta", "media", "baja"] as Urgency[])[i % 3],
    kam: kams[i % kams.length],
    productLeader: "Jhon Doe",
    nodes: ["Liderazgo"],
  };
});

export const MOCK_LDP_PROPOSALS: LdpProposal[] = [
  ..._extraNuevos,
  {
    id: "PROP-2026-0210",
    title: "Programa de liderazgo comercial",
    company: "Bancolombia",
    companyLogo: "https://logo.clearbit.com/bancolombia.com",
    applicant: "Juan Pérez",
    type: "Capacitación",
    createdAt: _addDays(-1),
    deadline: _addDays(1),
    status: "nuevo",
    urgency: "alta",
    kam: "Andrea Martínez",
    productLeader: "Jhon Doe",
    nodes: ["Liderazgo", "Comercial"],
  },
  {
    id: "PROP-2026-0211",
    title: "Diseño de ruta de transformación digital",
    company: "Grupo Éxito",
    companyLogo: "https://logo.clearbit.com/grupoexito.com.co",
    applicant: "Mariana López",
    type: "Consultoría",
    createdAt: _addDays(-3),
    deadline: _addDays(5),
    status: "proceso",
    urgency: "media",
    kam: "Carlos Riveros",
    productLeader: "Jhon Doe",
    professor: "Dr. Ricardo Mejía",
    nodes: ["Transformación digital"],
  },
  {
    id: "PROP-2026-0212",
    title: "Mentoría de innovación abierta",
    company: "Postobón",
    companyLogo: "https://logo.clearbit.com/postobon.com",
    applicant: "Roberto Castaño",
    type: "Mentoría",
    createdAt: _addDays(-5),
    deadline: _addDays(2),
    status: "costeo",
    urgency: "media",
    kam: "Diana Salcedo",
    productLeader: "Jhon Doe",
    professor: "Dra. Paula Henao",
    nodes: ["Innovación", "Estrategia"],
  },
  {
    id: "PROP-2026-0213",
    title: "Programa analítica de datos",
    company: "Sura",
    companyLogo: "https://logo.clearbit.com/sura.com",
    applicant: "Camila Ríos",
    type: "Capacitación",
    createdAt: _addDays(-8),
    deadline: _addDays(7),
    status: "ajustes",
    urgency: "baja",
    kam: "Andrea Martínez",
    productLeader: "Jhon Doe",
    professor: "Dr. Andrés Lozano",
    nodes: ["Analítica de datos"],
    adjustmentOwner: "profesor",
    adjustmentBy: "Jhon Doe",
    adjustmentAt: _addDays(-1),
    adjustmentReason:
      "El alcance no cubre los objetivos de aprendizaje acordados. Ajustar módulos 2 y 3 e incluir un caso práctico antes de continuar con el costeo.",
    totalCost: 45000000,
  },
  {
    id: "PROP-2026-0214",
    title: "Bootcamp de habilidades gerenciales",
    company: "EPM",
    companyLogo: "https://logo.clearbit.com/epm.com.co",
    applicant: "Felipe Ocampo",
    type: "Capacitación",
    createdAt: _addDays(-10),
    deadline: _addDays(14),
    status: "entregada",
    urgency: "baja",
    kam: "Carlos Riveros",
    productLeader: "Jhon Doe",
    professor: "Dr. Ricardo Mejía",
    nodes: ["Habilidades gerenciales"],
    totalCost: 48500000,
  },
  {
    id: "PROP-2026-0215",
    title: "Programa de cultura de servicio",
    company: "Davivienda",
    companyLogo: "https://logo.clearbit.com/davivienda.com",
    applicant: "Lucía Marín",
    type: "Capacitación",
    createdAt: _addDays(-18),
    deadline: _addDays(-2),
    status: "rechazada",
    urgency: "media",
    kam: "Diana Salcedo",
    productLeader: "Jhon Doe",
    professor: "Dra. Paula Henao",
    nodes: ["Servicio", "Cultura"],
    totalCost: 36000000,
    rejectionReason:
      "El cliente decidió no continuar con la propuesta tras revisión del comité interno: prefieren retomar el proceso el próximo trimestre con un alcance distinto.",
    rejectedBy: "Davivienda",
    rejectedAt: _addDays(-1),
  },
  {
    id: "PROP-2026-0216",
    title: "Consultoría en transformación estratégica",
    company: "Nutresa",
    companyLogo: "https://logo.clearbit.com/gruponutresa.com",
    applicant: "Santiago Morales",
    type: "Consultoría",
    createdAt: _addDays(-6),
    deadline: _addDays(10),
    status: "aprobacion",
    urgency: "media",
    kam: "Felipe Ortiz",
    productLeader: "Jhon Doe",
    professor: "Dr. Andrés Lozano",
    nodes: ["Liderazgo y Estrategia"],
  },
  {
    id: "PROP-2026-0217",
    title: "Capacitación en transformación financiera",
    company: "Bancolombia",
    companyLogo: "https://logo.clearbit.com/bancolombia.com",
    applicant: "Adriana Peña",
    type: "Capacitación",
    createdAt: _addDays(-12),
    deadline: _addDays(8),
    status: "aprobada",
    urgency: "baja",
    kam: "Andrea Martínez",
    productLeader: "Jhon Doe",
    professor: "Dra. Paula Henao",
    nodes: ["Liderazgo y Estrategia"],
    totalCost: 52000000,
  },
];

export { getDeadlineBucket };
