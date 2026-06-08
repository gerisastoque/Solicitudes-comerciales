export type RequestStatus = "nueva" | "lista" | "borrador" | "entregada" | "ajustes" | "rechazada";
export type AdjustmentOwner = "kam" | "ldp" | "profesor";
export type RequestType = "Capacitación" | "Consultoría" | "Mentoría";
export type Urgency = "alta" | "media" | "baja";
export type Priority = "alta" | "media" | "baja";

export interface RequestItem {
  id: string;
  title: string;
  applicant: string;
  type: RequestType;
  createdAt: string; // ISO
  deadline?: string; // ISO
  status: RequestStatus;
  urgency: Urgency;
  priority?: Priority;
  company: string;
  companyLogo?: string;
  node: string;
  productLeader: string;
  kam: string;
  professor?: string;
  totalCostCop?: number;
  sentAt?: string; // ISO when sent to client
  /** Motivo de ajuste interno (status === "ajustes"). */
  adjustmentReason?: string;
  adjustmentBy?: string;
  adjustmentAt?: string;
  /** Rol que tiene la acción pendiente cuando status === "ajustes". */
  adjustmentOwner?: AdjustmentOwner;
  /** Motivo del rechazo del cliente (status === "rechazada"). */
  clientRejectionReason?: string;
  clientRejectedAt?: string;
}

export const NODES = [
  "Biotecnología, Bioeconomía y Sostenibilidad",
  "Inteligencia Artificial y Tecnologías Digitales",
  "Innovación Educativa, Bienestar Social, Innovación Pública",
  "Competitividad Organizacional, Economías Creativas",
  "Salud Global, Calidad de Vida",
];

export const KAMS = ["Andrea Martínez", "Carlos Riveros", "Diana Salcedo", "Felipe Ortiz"];
export const PRODUCT_LEADERS = ["Jhon Doe", "María Camila Restrepo", "Sebastián Vélez", "Laura Caicedo"];
export const PROFESSORS = ["Dr. Ricardo Mejía", "Dra. Paula Henao", "Dr. Andrés Lozano"];

// Helpers para fechas relativas a "hoy" (mantienen la demo viva sin mover datos a runtime).
const _today = new Date();
const _addHours = (h: number) => {
  const d = new Date(_today);
  d.setHours(d.getHours() + h);
  return d.toISOString().slice(0, 10);
};
const _addDays = (days: number) => _addHours(days * 24);

const _extraNuevas: RequestItem[] = Array.from({ length: 10 }).map((_, i) => {
  const n = 150 + i;
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
  const types: RequestType[] = ["Capacitación", "Consultoría", "Mentoría"];
  const c = companies[i];
  return {
    id: `REQ-2026-0${n}`,
    title: `Solicitud de prueba ${i + 1} — ${c.name}`,
    applicant: ["Laura Gómez", "Mateo Ríos", "Sofía Vargas", "Andrés Niño", "Valentina Cruz", "Tomás Pardo", "Isabela Mora", "Sebastián León", "Camila Soto", "Daniel Páez"][i],
    type: types[i % 3],
    createdAt: _addDays(-(i + 1)),
    deadline: _addDays((i % 4) * 2 + 1),
    status: "nueva",
    urgency: (["alta", "media", "baja"] as Urgency[])[i % 3],
    priority: (["alta", "media", "baja"] as Priority[])[i % 3],
    company: c.name,
    companyLogo: c.logo,
    node: NODES[i % NODES.length],
    productLeader: PRODUCT_LEADERS[i % PRODUCT_LEADERS.length],
    kam: KAMS[i % KAMS.length],
  };
});

export const MOCK_REQUESTS: RequestItem[] = [
  ..._extraNuevas,
  {
    id: "REQ-2026-0142",
    title: "Capacitación interna - Marketing",
    applicant: "Juan Pérez",
    type: "Capacitación",
    createdAt: _addDays(-1),
    deadline: _addHours(18), // Urgente (≤24h)
    status: "nueva",
    urgency: "alta",
    priority: "alta",
    company: "Bancolombia",
    companyLogo: "https://logo.clearbit.com/bancolombia.com",
    node: NODES[1],
    productLeader: "Jhon Doe",
    kam: "Andrea Martínez",
  },
  {
    id: "REQ-2026-0143",
    title: "Consultoría en transformación digital",
    applicant: "Mariana López",
    type: "Consultoría",
    createdAt: _addDays(-1),
    deadline: _addDays(2), // Próximo a vencer (24-72h)
    status: "nueva",
    urgency: "media",
    priority: "media",
    company: "Grupo Éxito",
    companyLogo: "https://logo.clearbit.com/grupoexito.com.co",
    node: NODES[3],
    productLeader: "María Camila Restrepo",
    kam: "Carlos Riveros",
  },
  {
    id: "REQ-2026-0144",
    title: "Mentoría liderazgo ejecutivo",
    applicant: "Roberto Castaño",
    type: "Mentoría",
    createdAt: _addDays(-2),
    deadline: _addDays(10), // Sin etiqueta (>72h)
    status: "nueva",
    urgency: "baja",
    priority: "baja",
    company: "Postobón",
    companyLogo: "https://logo.clearbit.com/postobon.com",
    node: NODES[2],
    productLeader: "Sebastián Vélez",
    kam: "Diana Salcedo",
  },
  {
    id: "REQ-2026-0138",
    title: "Desarrollo de nueva funcionalidad",
    applicant: "Camila Ríos",
    type: "Capacitación",
    createdAt: _addDays(-15),
    deadline: _addDays(2), // Próximo a vencer
    status: "lista",
    urgency: "media",
    priority: "media",
    company: "Sura",
    companyLogo: "https://logo.clearbit.com/sura.com",
    node: NODES[1],
    productLeader: "Jhon Doe",
    kam: "Andrea Martínez",
    professor: "Dr. Ricardo Mejía",
    totalCostCop: 4_000_000,
  },
  {
    id: "REQ-2026-0131",
    title: "Programa analítica de datos",
    applicant: "Felipe Naranjo",
    type: "Capacitación",
    createdAt: _addDays(-20),
    status: "borrador",
    urgency: "baja",
    priority: "baja",
    company: "Nutresa",
    companyLogo: "https://logo.clearbit.com/gruponutresa.com",
    node: NODES[1],
    productLeader: "Laura Caicedo",
    kam: "Felipe Ortiz",
  },
  {
    id: "REQ-2026-0120",
    title: "Consultoría sostenibilidad operativa",
    applicant: "Ana Gutiérrez",
    type: "Consultoría",
    createdAt: _addDays(-30),
    deadline: _addDays(-2),
    status: "entregada",
    urgency: "media",
    priority: "media",
    company: "Cementos Argos",
    companyLogo: "https://logo.clearbit.com/argos.co",
    node: NODES[0],
    productLeader: "María Camila Restrepo",
    kam: "Carlos Riveros",
    professor: "Dra. Paula Henao",
    totalCostCop: 12_500_000,
    sentAt: _addDays(-3),
  },
  {
    id: "REQ-2026-0145",
    title: "Programa de liderazgo gerencial",
    applicant: "Daniela Castro",
    type: "Capacitación",
    createdAt: _addDays(-9),
    deadline: _addDays(5),
    status: "ajustes",
    urgency: "media",
    priority: "media",
    company: "EPM",
    companyLogo: "https://logo.clearbit.com/epm.com.co",
    node: NODES[3],
    productLeader: "Jhon Doe",
    kam: "Andrea Martínez",
    professor: "Dr. Ricardo Mejía",
    totalCostCop: 6_500_000,
    adjustmentOwner: "ldp",
    adjustmentBy: "Andrea Martínez",
    adjustmentAt: _addDays(-1),
    adjustmentReason:
      "Revisar el alcance del módulo de finanzas y ajustar el cronograma para que coincida con el calendario del cliente antes de reenviarlo.",
  },
  {
    id: "REQ-2026-0146",
    title: "Programa de cultura de servicio",
    applicant: "Lucía Marín",
    type: "Capacitación",
    createdAt: _addDays(-25),
    deadline: _addDays(-3),
    status: "rechazada",
    urgency: "media",
    priority: "media",
    company: "Davivienda",
    companyLogo: "https://logo.clearbit.com/davivienda.com",
    node: NODES[2],
    productLeader: "Jhon Doe",
    kam: "Diana Salcedo",
    professor: "Dra. Paula Henao",
    totalCostCop: 36_000_000,
    sentAt: _addDays(-10),
    clientRejectionReason:
      "El comité interno decidió aplazar el programa al próximo trimestre con un alcance distinto al propuesto.",
    clientRejectedAt: _addDays(-2),
  },
];

export const STATUS_META: Record<RequestStatus, { label: string; tone: string; dot: string }> = {
  nueva: { label: "Nueva", tone: "bg-accent/10 text-accent border-accent/20", dot: "bg-accent" },
  lista: { label: "Pendiente de envío", tone: "bg-info/10 text-info border-info/20", dot: "bg-info" },
  borrador: { label: "Borrador", tone: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  entregada: { label: "Enviada al cliente", tone: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  ajustes: { label: "En ajustes", tone: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  rechazada: { label: "Rechazada por cliente", tone: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive" },
};

export const ADJUSTMENT_OWNER_META: Record<AdjustmentOwner, { label: string }> = {
  kam: { label: "KAM" },
  ldp: { label: "Líder de Producto" },
  profesor: { label: "Profesor" },
};

export const URGENCY_META: Record<Urgency, { label: string; tone: string }> = {
  alta: { label: "Alta", tone: "text-destructive bg-destructive/10 border-destructive/20" },
  media: { label: "Media", tone: "text-warning bg-warning/10 border-warning/20" },
  baja: { label: "Baja", tone: "text-muted-foreground bg-muted border-border" },
};

export type DeadlineBucket = "urgente" | "proximo" | "sinfecha" | null;

export const DEADLINE_BUCKET_META: Record<Exclude<DeadlineBucket, null>, { label: string; tone: string }> = {
  urgente: { label: "Urgente", tone: "text-destructive bg-destructive/10 border-destructive/20" },
  proximo: { label: "Próximo a vencer", tone: "text-warning bg-warning/10 border-warning/20" },
  sinfecha: { label: "Sin fecha definida", tone: "text-muted-foreground bg-muted border-border" },
};

export function getDeadlineBucket(deadline?: string): DeadlineBucket {
  if (!deadline) return "sinfecha";
  const now = new Date();
  const d = new Date(deadline);
  const diffH = (d.getTime() - now.getTime()) / (1000 * 60 * 60);
  // Sin fecha → manejado arriba.
  // ≤ 24h (incluye vencidas) → Urgente.
  // 24h < x ≤ 72h → Próximo a vencer.
  // > 72h → sin etiqueta.
  if (diffH <= 24) return "urgente";
  if (diffH <= 72) return "proximo";
  return null;
}

export const PRIORITY_META: Record<Priority, { label: string; tone: string; rank: number }> = {
  alta: { label: "Alta / Urgente", tone: "text-destructive bg-destructive/10 border-destructive/20", rank: 0 },
  media: { label: "Media", tone: "text-warning bg-warning/10 border-warning/20", rank: 1 },
  baja: { label: "Baja", tone: "text-muted-foreground bg-muted border-border", rank: 2 },
};

export function formatCop(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
}

