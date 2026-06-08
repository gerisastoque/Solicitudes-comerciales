import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Play,
  AlertTriangle,
  XCircle,
  FileText,
  FileType,
  Upload,
  X,
  Save,
  Building2,
  GraduationCap,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Pencil,
  Wallet,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeadlineBucketBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CURRENT_PROFESSOR,
  PROF_STATUS_META,
  findProfessorProposal,
  getProfStatus,
  type ProfStatus,
} from "@/lib/profesor-data";
import { getDeadlineBucket } from "@/lib/ldp-data";

const INITIAL_REQUEST_DOCS = [
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
];

const MOCK_PROPOSAL_DOCS = [
  {
    name: "Propuesta_Programa_v3_final.pdf",
    size: "3.1 MB",
    date: "18/03/2026",
    type: "pdf" as const,
  },
  {
    name: "Cronograma_detallado.docx",
    size: "1.2 MB",
    date: "19/03/2026",
    type: "doc" as const,
  },
  {
    name: "Presupuesto_estimado.pdf",
    size: "780 KB",
    date: "20/03/2026",
    type: "pdf" as const,
  },
];

const MOCK_COMMENTS = [
  {
    author: "Jhon Doe",
    text: "Por favor incluir el desglose de horas por módulo y el perfil requerido de los participantes antes de enviar al KAM.",
    date: "15 Mar 2026 09:15",
  },
  {
    author: "Dr. Ricardo Mejía",
    text: "Incorporado el desglose de horas y ajustado el módulo 2 con el caso práctico del sector solicitado. Queda pendiente validar el número de participantes con el cliente.",
    date: "18 Mar 2026 14:30",
  },
];

type Doc = { name: string; size: string; date: string; type: "pdf" | "doc" };

function DocList({
  docs,
  editable = false,
  onDelete,
}: {
  docs: Doc[];
  editable?: boolean;
  onDelete?: (n: string) => void;
}) {
  if (docs.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin documentos.</p>;
  }
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
              onClick={() => onDelete?.(d.name)}
              aria-label={`Eliminar ${d.name}`}
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

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function ProfesorDetail() {
  const { id } = useParams();
  const original = useMemo(
    () => (id ? findProfessorProposal(id) : undefined),
    [id],
  );

  if (!original) {
    return (
      <AppShell role="Profesor">
        <Link
          to="/profesor/propuestas"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="mt-6 rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Propuesta no encontrada.
        </div>
      </AppShell>
    );
  }

  const initialStatus = (getProfStatus(original) ?? "nueva") as ProfStatus;
  const hasHistory = initialStatus === "enviada" || initialStatus === "ajuste";
  const [status, setStatus] = useState<ProfStatus>(initialStatus);
  const [proposalDocs, setProposalDocs] = useState<Doc[]>(
    hasHistory ? MOCK_PROPOSAL_DOCS : [],
  );
  const [comments, setComments] = useState<
    { author: string; text: string; date: string }[]
  >(hasHistory ? MOCK_COMMENTS : []);
  const [newComment, setNewComment] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [adjustEditMode, setAdjustEditMode] = useState(false);

  // Changes confirmation modal
  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [changesDescription, setChangesDescription] = useState("");
  const [savedChangesDescription, setSavedChangesDescription] = useState("");
  const [pendingAdjustAction, setPendingAdjustAction] = useState<
    "save" | "send" | null
  >(null);

  const isAjuste = status === "ajuste";
  const canEdit = status === "elaboracion" || (isAjuste && adjustEditMode);
  const isRechazada = status === "rechazada";
  const meta = PROF_STATUS_META[status];

  const handleStart = () => {
    setStatus("elaboracion");
    toast.success("Propuesta movida a elaboración", {
      description: "Se notificó al Líder de Producto y al Líder de Centro.",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const mapped: Doc[] = files.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      date: format(new Date(), "dd/MM/yyyy"),
      type: f.name.toLowerCase().endsWith(".pdf") ? "pdf" : "doc",
    }));
    setProposalDocs((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const handleDeleteDoc = (name: string) => {
    setProposalDocs((prev) => prev.filter((d) => d.name !== name));
    toast.success("Documento eliminado");
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        author: CURRENT_PROFESSOR.name,
        text: newComment.trim(),
        date: format(new Date(), "d MMM yyyy HH:mm", { locale: es }),
      },
    ]);
    setNewComment("");
    toast.success("Comentario agregado");
  };

  const handleSaveProgress = () => {
    toast.success("Avances guardados", {
      description:
        "La propuesta sigue en elaboración. Puedes continuar más tarde.",
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
    if (pendingAdjustAction === "save") {
      handleSaveProgress();
    } else if (pendingAdjustAction === "send") {
      setSendOpen(true);
    }
    setPendingAdjustAction(null);
  };

  const handleConfirmSend = () => {
    setSendSuccess(true);
    setStatus("enviada");
    setTimeout(() => {
      setSendOpen(false);
      setSendSuccess(false);
    }, 1800);
  };

  const metaCards = [
    {
      label: "Centro asignado",
      value: original.nodes?.join(", ") ?? "—",
      icon: Building2,
    },
    {
      label: "Fecha de entrega",
      value: original.deadline
        ? format(new Date(original.deadline), "d MMM yyyy", { locale: es })
        : "Sin fecha",
      icon: Calendar,
    },
    {
      label: "Líder de Producto",
      value: original.productLeader,
      icon: GraduationCap,
    },
    {
      label: "Líder de Centro",
      value: original.nodes?.[0] ?? "—",
      icon: GraduationCap,
    },
  ];

  return (
    <AppShell role="Profesor">
      <div>
        <Link
          to="/profesor/propuestas"
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
              <DeadlineBucketBadge
                bucket={getDeadlineBucket(original.deadline)}
              />
              <span className="text-xs text-muted-foreground">
                Creada{" "}
                {format(new Date(original.createdAt), "d MMM yyyy", {
                  locale: es,
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {status === "nueva" && (
              <Button onClick={handleStart}>
                <Play className="h-4 w-4" /> Iniciar elaboración
              </Button>
            )}
            {isAjuste && !adjustEditMode && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAdjustEditMode(true);
                    toast.success("Modo edición activado");
                  }}
                >
                  <Pencil className="h-4 w-4" /> Hacer ajustes
                </Button>
                <Button onClick={() => setSendOpen(true)}>
                  <Send className="h-4 w-4" /> Enviar al líder de producto
                </Button>
              </>
            )}
            {isAjuste && adjustEditMode && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPendingAdjustAction("save");
                    setChangesModalOpen(true);
                  }}
                >
                  <Save className="h-4 w-4" /> Guardar avances
                </Button>
                <Button
                  onClick={() => {
                    setPendingAdjustAction("send");
                    setChangesModalOpen(true);
                  }}
                >
                  <Send className="h-4 w-4" /> Enviar al líder de producto
                </Button>
              </>
            )}
            {status === "elaboracion" && (
              <>
                <Button variant="outline" onClick={handleSaveProgress}>
                  <Save className="h-4 w-4" /> Guardar avances
                </Button>
                <Button onClick={() => setSendOpen(true)}>
                  <Send className="h-4 w-4" /> Enviar al Líder de Producto
                </Button>
              </>
            )}
            <Button asChild variant="outline">
              <Link to={`/ldp/propuestas/${original.id}/resumen`}>
                <Eye className="h-4 w-4" /> Ver detalles
              </Link>
            </Button>
          </div>
        </div>

        {/* Alert: Rechazada */}
        {isRechazada && (
          <section className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <XCircle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-destructive">
                  Rechazada por el cliente
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {original.rejectedBy ? `Cliente: ${original.rejectedBy}` : ""}
                  {original.rejectedAt
                    ? ` · ${format(new Date(original.rejectedAt), "d MMM yyyy", { locale: es })}`
                    : ""}
                </p>
                {original.rejectionReason && (
                  <p className="mt-3 whitespace-pre-line text-sm text-foreground">
                    {original.rejectionReason}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Alert: En ajuste */}
        {isAjuste && original.adjustmentReason && (
          <section className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-foreground">
                  Propuesta en ajuste
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {original.adjustmentBy
                    ? `Devuelta por ${original.adjustmentBy}`
                    : "Devuelta para correcciones"}
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
                  <p className="mt-3 text-sm text-foreground whitespace-pre-line">
                    {original.adjustmentReason}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 4 meta cards */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metaCards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-md border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {label}
                </p>
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-foreground">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Two-column body */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Left column — información básica + documentos */}
          <div className="space-y-4 lg:col-span-2">
            <section className="rounded-md border border-border bg-card p-5">
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
                <InfoField label="Solicitante" value={original.applicant} />
                <InfoField label="Tipo" value={original.type} />
                <InfoField
                  label="Centro(s)"
                  value={original.nodes?.join(", ") ?? "—"}
                />
                <InfoField
                  label="Creada"
                  value={format(new Date(original.createdAt), "d MMM yyyy", {
                    locale: es,
                  })}
                />
                <InfoField
                  label="Fecha de entrega"
                  value={
                    original.deadline
                      ? format(new Date(original.deadline), "d MMM yyyy", {
                          locale: es,
                        })
                      : "Sin fecha"
                  }
                />
              </dl>
            </section>

            {/* Documentos de la solicitud */}
            <section className="rounded-md border border-border bg-card p-5">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Documentos de la solicitud
              </h2>
              <div className="mt-3">
                <DocList docs={INITIAL_REQUEST_DOCS} />
              </div>
            </section>

            {/* Documentos de la propuesta */}
            <section className="rounded-md border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Documentos de la propuesta
                </h2>
                {canEdit && (
                  <>
                    <input
                      type="file"
                      id="prof-file-upload"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <Button asChild variant="outline" size="sm">
                      <label
                        htmlFor="prof-file-upload"
                        className="cursor-pointer"
                      >
                        <Upload className="h-4 w-4" /> Cargar documentos
                      </label>
                    </Button>
                  </>
                )}
              </div>
              <div className="mt-3">
                <DocList
                  docs={proposalDocs}
                  editable={canEdit}
                  onDelete={handleDeleteDoc}
                />
              </div>
            </section>
          </div>

          {/* Right sidebar — costeo + comentarios */}
          <aside className="space-y-4">
            {(original.totalCost != null || isAjuste) && (
              <div className="rounded-md border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Costeo final
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Costo total del programa (COP)
                </p>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
                  ${(original.totalCost ?? 38500000).toLocaleString("es-CO")} COP
                </p>
              </div>
            )}

            <section className="rounded-md border border-border bg-card p-5">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Comentarios
              </h2>
              <div className="mt-3 space-y-3">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aún no hay comentarios.
                  </p>
                ) : (
                  comments.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-border bg-background p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">
                          {c.author}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {c.date}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-foreground whitespace-pre-line">
                        {c.text}
                      </p>
                    </div>
                  ))
                )}

                {canEdit && (
                  <div className="flex flex-col gap-2">
                    {status === "elaboracion" && (
                      <div className="rounded-md border border-border bg-secondary/40 px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Preguntas guía
                        </p>
                        <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                          <li>· ¿Qué licencias necesitas?</li>
                          <li>· ¿Cuál es el equipo de trabajo?</li>
                          <li>· ¿Requieres monitores?</li>
                          <li>· ¿Necesitas más profesores?</li>
                        </ul>
                      </div>
                    )}
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Agregar un comentario..."
                      rows={3}
                      className="w-full"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="w-full"
                    >
                      <MessageSquare className="h-4 w-4" /> Agregar
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Modal de confirmación de cambios */}
      <Dialog open={changesModalOpen} onOpenChange={setChangesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar ajustes realizados</DialogTitle>
            <DialogDescription>
              Antes de continuar, especifica qué cambios realizaste para
              facilitar la revisión del Líder de Producto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="prof-changes-desc">Cambios realizados</Label>
            <Textarea
              id="prof-changes-desc"
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

      {/* Dialog de envío */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="sm:max-w-md">
          {sendSuccess ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-3 font-display text-base font-bold text-foreground">
                Propuesta enviada
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Se notificó al Líder de Producto y al Líder de Centro.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Enviar al Líder de Producto</DialogTitle>
                <DialogDescription>
                  La propuesta cambiará al estado "Enviada" y el Líder de
                  Producto y el Líder de Centro serán notificados.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
                <p className="font-medium text-foreground">{original.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {original.company} · {proposalDocs.length} documento
                  {proposalDocs.length === 1 ? "" : "s"} adjunto
                  {proposalDocs.length === 1 ? "" : "s"}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSendOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmSend}>
                  <Send className="h-4 w-4" /> Confirmar envío
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
