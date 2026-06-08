import { MOCK_LDP_PROPOSALS, PROFESSOR_DIRECTORY, LDP_STATUS_META, type LdpProposal, type LdpStatus } from "./ldp-data";

/**
 * Centro del Líder de Centro logueado (mock).
 * Reúne los profesores ya definidos en PROFESSOR_DIRECTORY como integrantes
 * de un único centro para la demo, sin modificar los datos existentes.
 */
export const CURRENT_NODE = {
  id: "liderazgo-estrategia",
  name: "Liderazgo y Estrategia",
  leader: "María Camila Restrepo",
} as const;

export const slugProfessor = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^(dr|dra)\.?\s+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const NODE_PROFESSORS = PROFESSOR_DIRECTORY.map((p) => ({
  ...p,
  slug: slugProfessor(p.name),
}));

const NODE_PROFESSOR_NAMES = new Set(NODE_PROFESSORS.map((p) => p.name));

/** Propuestas asociadas al centro: las que tienen un profesor del centro
 *  o aún están sin asignar (status === "nuevo") y por lo tanto deben
 *  ser distribuidas por el Líder de Centro. */
export const NODE_PROPOSALS: LdpProposal[] = MOCK_LDP_PROPOSALS.filter(
  (p) => (p.professor && NODE_PROFESSOR_NAMES.has(p.professor)) || p.status === "nuevo",
);

export const getProfessorBySlug = (slug: string) =>
  NODE_PROFESSORS.find((p) => p.slug === slug);

export const getProposalsForProfessor = (name: string) =>
  NODE_PROPOSALS.filter((p) => p.professor === name);

/**
 * Labels personalizados del Centro para estados LDP.
 * Úsalos en lugar de LDP_STATUS_META[col].label cuando se muestre en el flujo Centro.
 */
export const CENTRO_STATUS_LABELS: Partial<Record<LdpStatus, string>> = {
  aprobacion: "Por aprobar",
};
