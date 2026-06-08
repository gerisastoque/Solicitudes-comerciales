import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  RotateCcw,
  AlertTriangle,
  User,
  UserPlus,
  FileText,
  FileType,
  Mail,
  Upload,
  Pencil,
  CheckCircle2,
  XCircle,
  Wallet,
  X,
  Eye,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  MOCK_LDP_PROPOSALS,
  LDP_STATUS_META,
  PROFESSOR_DIRECTORY,
  type LdpStatus,
  type AdjustmentOwner,
} from "@/lib/ldp-data";
import { ADJUSTMENT_OWNER_META } from "@/lib/mock-data";

const INITIAL_PROPOSAL_DOCS = [
  {
    name: "Propuesta_Programa_Capacitacion_v2.pdf",
    size: "2.4 MB",
    date: "15/03/2026",
    type: "pdf" as const,
  },
  {
    name: "Anexo_Cronograma.docx",
    size: "856 KB",
    date: "15/03/2026",
    type: "doc" as const,
  },
];

const UPLOADED_DOCS = [
  {
    name: "Brief_Cliente.pdf",
    size: "1.2 MB",
    date: "12/03/2026",
    type: "pdf" as const,
  },
  {
    name: "Requerimientos_Iniciales.docx",
    size: "640 KB",
    date: "12/03/2026",
    type: "doc" as const,
  },
  {
    name: "Plan_Capacitacion.pdf",
    size: "2.1 MB",
    date: "13/03/2026",
    type: "pdf" as const,
  },
];

const SUMMARY_SECTIONS = [
  {
    id: "empresa",
    title: "Empresa",
    fields: [
      ["Nombre de la empresa", "Razón social S.A."],
      ["La empresa es", "Privada"],
      ["Sector o industria", "Financiero"],
      ["Descripción breve", "Descripción breve de la empresa"],
      ["Página web", "www.pagina.com"],
    ],
  },
  {
    id: "contacto",
    title: "Contacto",
    fields: [
      ["Nombre", "Juan Pérez"],
      ["Cargo", "Jefe de talento humano"],
      ["Teléfono", "+57 123 456 7890"],
      ["Correo institucional", "name@email.com"],
      ["Área o dependencia", "Talento humano"],
    ],
  },
  {
    id: "requerimiento",
    title: "Requerimiento",
    fields: [
      ["Tipo de requerimiento", "Capacitación"],
      ["Nombre para la solicitud", "Nombre del programa"],
      ["Necesidad o problema", "—"],
      ["Horas de dedicación", "Más de 60"],
      ["Modalidad", "Híbrida"],
      ["Servicio de alimentación", "Sí"],
      ["Resultados esperados", "—"],
      ["Cómo se medirá el éxito", "—"],
      ["Competencias a fortalecer", "—"],
      ["Número de participantes", "1 - 5"],
      ["Área de los participantes", "Comercial"],
    ],
  },
  {
    id: "formacion",
    title: "Formación previa",
    fields: [
      ["¿Han tenido formación previa?", "No"],
      ["Descripción", "—"],
    ],
  },
  {
    id: "observaciones",
    title: "Observaciones",
    fields: [["¿Alguna otra observación?", "—"]],
  },
];

type DocItem = (typeof INITIAL_PROPOSAL_DOCS)[number];

function DocList({
  docs,
  editable = false,
  onDelete,
}: {
  docs: DocItem[];
  editable?: boolean;
  onDelete?: (name: string) => void;
}) {
  return (
    <div className="space-y-2">
      {docs.map((d) => (
        <div
          key={d.name}
          className="flex items-center justify-between rounded-md border border-border bg-background p-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary text-muted-foreground">
              {d.type === "pdf" ? (
                <FileText className="h-4 w-4" />
              ) : (
                <FileType className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{d.name}</p>
              <p className="text-xs text-muted-foreground">
                {d.size} · {d.date}
              </p>
            </div>
          </div>
          {editable ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Eliminar ${d.name}`}
              onClick={() => onDelete?.(d.name)}
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm">
              Descargar
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function formatCopInput(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("es-CO");
}

function formatCopDisplay(n: number) {
  return `$${n.toLocaleString("es-CO")} COP`;
}

export default function LdpDetail() {
  const { id } = useParams();
  const original = useMemo(
    () => MOCK_LDP_PROPOSALS.find((p) => p.id === id) ?? MOCK_LDP_PROPOSALS[0],
    [id],
  );
  const [status, setStatus] = useState<LdpStatus>(original.status);
  const [adjustmentOwner, setAdjustmentOwner] = useState<
    AdjustmentOwner | undefined
  >(original.adjustmentOwner);
  const [professor, setProfessor] = useState<{
    name: string;
    email: string;
  } | null>(
    original.professor
      ? { name: original.professor, email: original.professorEmail ?? "" }
      : null,
  );
  const [pendingProfessor, setPendingProfessor] = useState<string>("");

  // Multi-select professor state (REQ 5)
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  const [professorResponsibilities, setProfessorResponsibilities] = useState<
    Record<string, string>
  >({});

  // Proposal files editing state
  const [proposalDocs, setProposalDocs] = useState<DocItem[]>(
    INITIAL_PROPOSAL_DOCS,
  );
  const [editingProposalFiles, setEditingProposalFiles] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Costing state
  const [costingSaved, setCostingSaved] = useState<boolean>(!!original.costing);
  const [costingFiles, setCostingFiles] = useState<
    { name: string; size: string }[]
  >(original.costing?.files ?? []);
  const [doctorateHours, setDoctorateHours] = useState<string>(
    original.costing?.doctorateHours?.toString() ?? "",
  );
  const [monitorHours, setMonitorHours] = useState<string>(
    original.costing?.monitorHours?.toString() ?? "",
  );
  const [externalAdvisor, setExternalAdvisor] = useState<"si" | "no" | "">(
    original.costing?.externalAdvisor ?? "",
  );

  const [totalCost, setTotalCost] = useState<string>(
    original.totalCost
      ? Number(original.totalCost).toLocaleString("es-CO")
      : "",
  );
  const totalCostNumber = Number(totalCost.replace(/\D/g, "")) || 0;

  // Changes confirmation modal (ajustes flow)
  const [comingFromAjustes, setComingFromAjustes] = useState(false);
  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [changesDescription, setChangesDescription] = useState("");
  const [savedChangesDescription, setSavedChangesDescription] = useState("");

  // Dialogs
  const [sendOpen, setSendOpen] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const meta = LDP_STATUS_META[status];

  const handleAssignProfessor = () => {
    const found = PROFESSOR_DIRECTORY.find((p) => p.name === pendingProfessor);
    if (!found) {
      toast.error("Selecciona un profesor de la lista");
      return;
    }
    setProfessor(found);
    setStatus("proceso");
    toast.success("Profesor asignado", {
      description: `${found.name} fue notificado en ${found.email}.`,
    });
  };

  // REQ 5: Assign multiple professors
  const handleAssignMultiple = () => {
    if (selectedProfessors.length === 0) {
      toast.error("Selecciona al menos un profesor");
      return;
    }
    const first = PROFESSOR_DIRECTORY.find(
      (p) => p.name === selectedProfessors[0],
    );
    if (first) {
      setProfessor(first);
    }
    setStatus("proceso");
    toast.success(
      `${selectedProfessors.length} profesor${selectedProfessors.length === 1 ? "" : "es"} asignado${selectedProfessors.length === 1 ? "" : "s"}`,
      {
        description:
          "Los profesores fueron notificados para iniciar el desarrollo.",
      },
    );
  };

  const handleToggleProfessor = (name: string, checked: boolean) => {
    setSelectedProfessors((prev) =>
      checked ? [...prev, name] : prev.filter((n) => n !== name),
    );
    if (!checked) {
      setProfessorResponsibilities((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleResendToProfessor = () => {
    setStatus("proceso");
    setAdjustmentOwner(undefined);
    toast.success("Propuesta reenviada al profesor", {
      description:
        "Se ha enviado al profesor responsable para realizar los cambios.",
    });
  };

  const handleAdjustCosting = () => {
    setComingFromAjustes(true);
    setStatus("costeo");
    setAdjustmentOwner(undefined);
    setCostingSaved(false);
    setEditingProposalFiles(true);
    toast.success("Propuesta lista para ajustar el costeo", {
      description:
        "Puedes editar los archivos de propuesta y el análisis de costeo.",
    });
  };

  const handleConfirmChanges = () => {
    if (!changesDescription.trim()) {
      toast.error(
        "Especifica dónde se hicieron los cambios antes de continuar",
      );
      return;
    }
    setSavedChangesDescription(changesDescription);
    setChangesDescription("");
    setChangesModalOpen(false);
    setSendOpen(true);
  };

  const handleStartAdjustments = () => {
    setCostingSaved(false);
    setEditingProposalFiles(true);
    toast.success("Modo edición activado", {
      description:
        "Puedes editar los archivos de propuesta y el análisis de costeo.",
    });
  };

  const handleProposalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const mapped: DocItem[] = files.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      date: format(new Date(), "dd/MM/yyyy"),
      type: f.name.toLowerCase().endsWith(".pdf") ? "pdf" : "doc",
    }));
    setProposalDocs((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const handleConfirmDeleteFile = () => {
    if (!fileToDelete) return;
    setProposalDocs((prev) => prev.filter((d) => d.name !== fileToDelete));
    toast.success("Archivo eliminado", { description: fileToDelete });
    setFileToDelete(null);
  };

  const handleSaveCosting = () => {
    setCostingSaved(true);
    toast.success("Análisis de costeo guardado");
  };

  const handleEditCosting = () => setCostingSaved(false);

  // REQ 6: send to aprobacion instead of entregada
  const handleConfirmSend = () => {
    setSendSuccess(true);
    setStatus("aprobacion");
    setTimeout(() => {
      setSendOpen(false);
      setSendSuccess(false);
      toast.success(
        "La propuesta se ha enviado al líder de centro responsable para su aprobación",
      );
    }, 1800);
  };

  // REQ 8: send to KAM directly from aprobada
  const handleSendToKam = () => {
    setStatus("entregada");
    toast.success(
      "La propuesta se ha enviado al KAM responsable para ser entregada al cliente",
    );
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Indica el motivo del ajuste");
      return;
    }
    setRejectOpen(false);
    setStatus("ajustes");
    setAdjustmentOwner("profesor");
    toast.success("Propuesta enviada a ajustes", {
      description: `Se notificó a ${professor?.name ?? "el profesor"} para realizar los ajustes solicitados.`,
    });
    setRejectReason("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const mapped = files.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
    }));
    setCostingFiles((prev) => [...prev, ...mapped]);
  };

  const meta_grid = [
    {
      label: "Centro asignado",
      value:
        original.nodes && original.nodes.length > 0
          ? original.nodes.join(", ")
          : "Sin asignar",
    },
    { label: "Líder de Producto", value: original.productLeader },
    { label: "Profesor", value: professor?.name ?? "Sin asignar" },
    { label: "KAM responsable", value: original.kam },
  ];

  const isCosteo = status === "costeo";
  const isEntregada = status === "entregada";
  const isAjustes = status === "ajustes";
  const isClientRejected = status === "rechazada";
  const isAprobacion = status === "aprobacion";
  const isAprobada = status === "aprobada";
  const ldpOwnsAdjustment = isAjustes && adjustmentOwner === "ldp";
  const profesorOwnsAdjustment = isAjustes && adjustmentOwner === "profesor";

  // Show costeo aside for costeo, entregada, aprobacion, aprobada
  const showCosteoAside =
    isCosteo || isEntregada || isAprobacion || isAprobada || isAjustes;

  return (
    <AppShell role="Líder de Producto">
      <div>
        <Link
          to="/ldp/propuestas"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a propuestas
        </Link>

        {/* Header */}
        <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-card p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-muted-foreground">
              {original.id}
            </p>
            <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight">
              {original.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
                  meta.tone,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                {meta.label}
              </span>
              <span className="rounded border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {original.type}
              </span>
              <span className="text-xs text-muted-foreground">
                Creada{" "}
                {format(new Date(original.createdAt), "d MMM yyyy", {
                  locale: es,
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* REQ 9: Show ajustes buttons for ALL ajustes, not just ldpOwnsAdjustment */}
            {isAjustes && (
              <>
                <Button onClick={handleAdjustCosting} variant="outline">
                  <Pencil className="h-4 w-4" /> Hacer ajustes
                </Button>
                <Button onClick={handleResendToProfessor}>
                  <RotateCcw className="h-4 w-4" /> Reenviar al profesor
                </Button>
              </>
            )}
            {/* REQ 8: Send to KAM button for aprobada */}
            {isAprobada && (
              <Button onClick={handleSendToKam}>
                <Send className="h-4 w-4" /> Enviar a KAM
              </Button>
            )}
            {isCosteo && !editingProposalFiles && (
              <Button variant="outline" onClick={handleStartAdjustments}>
                <Pencil className="h-4 w-4" /> Realizar ajustes
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to={`/ldp/propuestas/${original.id}/resumen`}>
                <Eye className="h-4 w-4" /> Ver detalles
              </Link>
            </Button>
          </div>
        </div>

        {/* Disclaimer: En ajustes (interno) */}
        {isAjustes && (
          <section className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-foreground">
                  Propuesta en ajustes
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Acción pendiente:{" "}
                  <span className="font-medium text-foreground">
                    {adjustmentOwner
                      ? ADJUSTMENT_OWNER_META[adjustmentOwner].label
                      : "Profesor"}
                  </span>
                  {original.adjustmentBy
                    ? ` · Devuelta por ${original.adjustmentBy}`
                    : ""}
                  {original.adjustmentAt
                    ? ` · ${format(new Date(original.adjustmentAt), "d MMM yyyy", { locale: es })}`
                    : ""}
                </p>
                {savedChangesDescription ? (
                  <p className="mt-3 text-sm text-foreground">
                    <span className="font-medium">Se realizan cambios en:</span>{" "}
                    {savedChangesDescription}
                  </p>
                ) : (
                  <>
                    {original.adjustmentReason && (
                      <p className="mt-3 text-sm text-foreground whitespace-pre-line">
                        {original.adjustmentReason}
                      </p>
                    )}
                    {profesorOwnsAdjustment && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Esperando los ajustes de{" "}
                        {professor?.name ?? "el profesor"}.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* REQ 7: Disclaimer En aprobación */}
        {isAprobacion && (
          <section className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Info className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-foreground">
                  Esperando aprobación
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Esta propuesta está siendo revisada por el líder de centro
                  para poder ser enviada al KAM.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* REQ 8: Disclaimer Aprobada */}
        {isAprobada && (
          <section className="mt-4 rounded-md border border-success/30 bg-success/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-foreground">
                  Aprobada por el líder de centro
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Esta propuesta ha sido aprobada. Puedes enviarla al KAM.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Disclaimer: Rechazada por el cliente */}
        {isClientRejected && (
          <section className="mt-4 rounded-md border-2 border-destructive/40 bg-destructive/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <XCircle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-destructive">
                  Rechazada por el cliente
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {original.rejectedBy ?? "Cliente"}
                  {original.rejectedAt
                    ? ` · ${format(new Date(original.rejectedAt), "d MMM yyyy", { locale: es })}`
                    : ""}
                </p>
                {original.rejectionReason && (
                  <p className="mt-3 text-sm text-foreground whitespace-pre-line">
                    {original.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Meta grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {meta_grid.map((m) => (
            <div
              key={m.label}
              className="rounded-md border border-border bg-card p-4"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Asignación de profesor (estado: nuevo / "Por asignar profesor") */}
        {status === "nuevo" && (
          <section className="mt-4 rounded-md border border-accent/30 bg-accent/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
                <UserPlus className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-foreground">
                  Asignar profesor
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecciona el profesor responsable. Se le notificará por
                  correo para iniciar el desarrollo.
                </p>

                {/* REQ 5: Toggle between single and multi-select */}
                <div className="mt-3 flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMultiSelectMode((v) => !v);
                      setSelectedProfessors([]);
                      setProfessorResponsibilities({});
                    }}
                  >
                    {multiSelectMode ? "Seleccionar uno" : "Seleccionar varios"}
                  </Button>
                </div>

                {!multiSelectMode ? (
                  <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">
                        Profesor
                      </Label>
                      <Select
                        value={pendingProfessor}
                        onValueChange={setPendingProfessor}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un profesor" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFESSOR_DIRECTORY.map((p) => (
                            <SelectItem key={p.name} value={p.name}>
                              <span className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {p.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {p.email}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {pendingProfessor && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {
                            PROFESSOR_DIRECTORY.find(
                              (p) => p.name === pendingProfessor,
                            )?.email
                          }
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleAssignProfessor}
                      disabled={!pendingProfessor}
                    >
                      <UserPlus className="h-4 w-4" /> Asignar
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 space-y-3">
                    {PROFESSOR_DIRECTORY.map((p) => {
                      const checked = selectedProfessors.includes(p.name);
                      return (
                        <div key={p.name} className="space-y-1.5">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                handleToggleProfessor(p.name, e.target.checked)
                              }
                              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                            />
                            <span className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {p.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {p.email}
                              </span>
                            </span>
                          </label>
                          {checked && (
                            <div className="ml-6.5">
                              <Input
                                placeholder="Especifique la responsabilidad de este profesor"
                                value={professorResponsibilities[p.name] ?? ""}
                                onChange={(e) =>
                                  setProfessorResponsibilities((prev) => ({
                                    ...prev,
                                    [p.name]: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="pt-2">
                      <Button
                        onClick={handleAssignMultiple}
                        disabled={selectedProfessors.length === 0}
                      >
                        <UserPlus className="h-4 w-4" />
                        Asignar ({selectedProfessors.length} seleccionado
                        {selectedProfessors.length === 1 ? "" : "s"})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Información básica + Costeo aside */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section
            className={cn(
              "rounded-md border border-border bg-card p-5",
              showCosteoAside ? "lg:col-span-2" : "lg:col-span-3",
            )}
          >
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-base font-bold">
                Información básica
              </h2>
              <p className="text-xs text-muted-foreground">
                Datos de la propuesta
              </p>
            </div>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <InfoField label="Empresa" value={original.company} />
              <InfoField label="Tipo de empresa" value="Privada" />
              <InfoField label="Sector" value="Financiero" />
              <InfoField label="Solicitante" value={original.applicant} />
              <InfoField label="Modalidad" value="Híbrida" />
              <InfoField label="Participantes" value="11 - 15" />
              <InfoField label="Horas estimadas" value="60 horas" />
              <InfoField label="Servicio de alimentación" value="Sí" />
            </dl>

            {(isCosteo ||
              isEntregada ||
              isAjustes ||
              isClientRejected ||
              isAprobacion ||
              isAprobada) && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Documentos de propuesta
                </h3>
                <div className="mt-2">
                  <DocList
                    docs={proposalDocs}
                    editable={isCosteo && editingProposalFiles}
                    onDelete={(name) => setFileToDelete(name)}
                  />
                </div>
                {isCosteo && editingProposalFiles && (
                  <label
                    htmlFor="proposal-files-upload-basic"
                    className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-background px-4 py-5 text-center transition-colors hover:border-accent/50"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Subir archivo de reemplazo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOCX, XLSX
                    </p>
                    <input
                      id="proposal-files-upload-basic"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleProposalFileUpload}
                    />
                  </label>
                )}
              </div>
            )}
          </section>

          {showCosteoAside && (
            <aside className="space-y-4">
              {(isEntregada || isAprobacion || isAprobada || isAjustes) && (
                <div className="rounded-md border border-border bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Costeo final
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Precio enviado al KAM
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
                    {formatCopDisplay(
                      totalCostNumber || original.totalCost || 1000000,
                    )}
                  </p>
                </div>
              )}
              {isCosteo && (
                <>
                  <div className="rounded-md border border-border bg-card p-5">
                    <Label
                      htmlFor="totalCost"
                      className="text-sm font-medium text-foreground"
                    >
                      Costo total del programa (COP)
                    </Label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="totalCost"
                        inputMode="numeric"
                        className="pl-7"
                        value={totalCost}
                        onChange={(e) =>
                          setTotalCost(formatCopInput(e.target.value))
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() =>
                        comingFromAjustes
                          ? setChangesModalOpen(true)
                          : setSendOpen(true)
                      }
                      disabled={!totalCostNumber}
                    >
                      <Send className="h-4 w-4" /> Enviar a aprobación
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-warning hover:text-warning"
                      onClick={() => setRejectOpen(true)}
                    >
                      <RotateCcw className="h-4 w-4" /> Enviar a ajustes
                    </Button>
                  </div>
                </>
              )}
            </aside>
          )}
        </div>

        {/* Análisis de costeo (solo en estado costeo) */}
        {isCosteo && (
          <>
            <section className="mt-4 rounded-md border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold">
                    Análisis de costeo
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Esta información no se comparte con el KAM
                  </p>
                </div>
                {costingSaved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditCosting}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                )}
              </div>

              {!costingSaved ? (
                <div className="mt-4 space-y-4">
                  {/* File upload */}
                  <div>
                    <Label className="text-sm font-medium text-foreground">
                      Archivos de soporte{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </Label>
                    <label
                      htmlFor="costing-files"
                      className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-background px-4 py-6 text-center transition-colors hover:border-accent/50"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium text-foreground">
                        Arrastra o haz clic para subir archivos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOCX, XLSX
                      </p>
                      <input
                        id="costing-files"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                    {costingFiles.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {costingFiles.map((f, i) => (
                          <li
                            key={`${f.name}-${i}`}
                            className="flex items-center justify-between rounded border border-border bg-background px-3 py-2 text-xs"
                          >
                            <span className="flex items-center gap-2 text-foreground">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              {f.name}
                            </span>
                            <span className="text-muted-foreground">
                              {f.size}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="doctorate"
                        className="text-sm font-medium text-foreground"
                      >
                        Horas de doctorado{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          (opcional)
                        </span>
                      </Label>
                      <Input
                        id="doctorate"
                        type="number"
                        min={0}
                        value={doctorateHours}
                        onChange={(e) => setDoctorateHours(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="monitor"
                        className="text-sm font-medium text-foreground"
                      >
                        Horas de monitor{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          (opcional)
                        </span>
                      </Label>
                      <Input
                        id="monitor"
                        type="number"
                        min={0}
                        value={monitorHours}
                        onChange={(e) => setMonitorHours(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      ¿Requiere asesor externo?{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </Label>
                    <RadioGroup
                      value={externalAdvisor}
                      onValueChange={(v) =>
                        setExternalAdvisor(v as "si" | "no")
                      }
                      className="flex gap-6"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="si" /> Sí
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="no" /> No
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveCosting}>Guardar</Button>
                  </div>
                </div>
              ) : (
                <dl className="mt-4 divide-y divide-border">
                  <div className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-medium text-muted-foreground sm:col-span-1">
                      Archivos de soporte
                    </dt>
                    <dd className="text-sm text-foreground sm:col-span-2">
                      {costingFiles.length === 0
                        ? "Sin archivos"
                        : costingFiles.map((f) => f.name).join(", ")}
                    </dd>
                  </div>
                  <div className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-medium text-muted-foreground sm:col-span-1">
                      Horas de doctorado
                    </dt>
                    <dd className="text-sm text-foreground sm:col-span-2">
                      {doctorateHours}
                    </dd>
                  </div>
                  <div className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-medium text-muted-foreground sm:col-span-1">
                      Horas de monitor
                    </dt>
                    <dd className="text-sm text-foreground sm:col-span-2">
                      {monitorHours}
                    </dd>
                  </div>
                  <div className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-xs font-medium text-muted-foreground sm:col-span-1">
                      ¿Requiere asesor externo?
                    </dt>
                    <dd className="text-sm text-foreground sm:col-span-2">
                      {externalAdvisor === "si" ? "Sí" : "No"}
                    </dd>
                  </div>
                </dl>
              )}
            </section>
          </>
        )}
      </div>

      {/* REQ 6: Confirmación de envío a aprobación */}
      <Dialog
        open={sendOpen}
        onOpenChange={(o) => {
          if (!sendSuccess) setSendOpen(o);
        }}
      >
        <DialogContent>
          {!sendSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Estás a punto de enviar el costeo a aprobación
                </DialogTitle>
                <DialogDescription>
                  Revisa el valor antes de confirmar el envío.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md border border-border bg-secondary/40 p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  El costo total del programa es de
                </p>
                <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
                  {formatCopDisplay(totalCostNumber)}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSendOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmSend}>
                  <Send className="h-4 w-4" /> Enviar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <p className="mt-4 font-display text-lg font-bold text-foreground">
                La propuesta ha sido enviada al líder de centro para aprobación
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rechazo */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar a ajustes</DialogTitle>
            <DialogDescription>
              La propuesta volverá al Profesor con tu retroalimentación. Quedará
              en estado "En ajustes" con la acción pendiente del Profesor. No se
              eliminará el historial.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="reason">Motivo del ajuste</Label>
            <Textarea
              id="reason"
              rows={5}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Describe qué debe ajustarse en la propuesta…"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReject}>
              <RotateCcw className="h-4 w-4" /> Enviar a ajustes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de cambios */}
      <Dialog open={changesModalOpen} onOpenChange={setChangesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar ajustes realizados</DialogTitle>
            <DialogDescription>
              Antes de enviar a aprobación, especifica qué cambios realizaste
              para facilitar la revisión.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="ldp-changes-desc">Cambios realizados</Label>
            <Textarea
              id="ldp-changes-desc"
              rows={4}
              required
              value={changesDescription}
              onChange={(e) => setChangesDescription(e.target.value)}
              placeholder="Especifique exactamente dónde se hicieron los cambios para facilitar su revisión"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangesModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmChanges}>
              <Send className="h-4 w-4" /> Confirmar envío
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación de archivo de propuesta */}
      <Dialog
        open={!!fileToDelete}
        onOpenChange={(o) => {
          if (!o) setFileToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar archivo?</DialogTitle>
            <DialogDescription>
              Se eliminará{" "}
              <span className="font-medium text-foreground">
                {fileToDelete}
              </span>{" "}
              de los archivos de propuesta. Podrás subir un reemplazo después.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteFile}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
