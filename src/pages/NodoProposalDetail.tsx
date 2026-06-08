import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  XCircle,
  UserPlus,
  Mail,
  FileText,
  FileType,
  Eye,
  CheckCircle2,
  Info,
  ThumbsUp,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { DeadlineBucketBadge } from "@/components/StatusBadge";
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
import {
  MOCK_LDP_PROPOSALS,
  LDP_STATUS_META,
  getDeadlineBucket,
  type LdpStatus,
} from "@/lib/ldp-data";
import { CURRENT_NODE, NODE_PROFESSORS } from "@/lib/nodo-data";
import { formatCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const PROPOSAL_DOCS = [
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

export default function NodoProposalDetail() {
  const { id } = useParams();
  const p = MOCK_LDP_PROPOSALS.find((x) => x.id === id);

  const [status, setStatus] = useState<LdpStatus>(p?.status ?? "nuevo");
  const [assignedProfessor, setAssignedProfessor] = useState<string | null>(
    p?.professor ?? null,
  );
  const [pendingProfessor, setPendingProfessor] = useState<string>("");

  // Multi-select professor state (same as LDP)
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([]);
  const [professorResponsibilities, setProfessorResponsibilities] = useState<
    Record<string, string>
  >({});

  // Adjustment modal state
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustReason, setAdjustReason] = useState("");

  if (!p) {
    return (
      <AppShell role="Líder de Centro">
        <Link
          to="/nodo/propuestas"
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

  const meta = LDP_STATUS_META[status];
  const isNuevo = status === "nuevo" && !assignedProfessor;
  const isAprobacion = status === "aprobacion";
  const isAprobada = status === "aprobada";
  const centroAsignado =
    p.nodes && p.nodes.length > 0 ? p.nodes.join(", ") : "Sin asignar";
  const showCosteoAside = p.totalCost != null || isAprobacion;

  const handleAssignProfessor = () => {
    const found = NODE_PROFESSORS.find(
      (prof) => prof.name === pendingProfessor,
    );
    if (!found) {
      toast.error("Selecciona un profesor de la lista");
      return;
    }
    setAssignedProfessor(found.name);
    toast.success("Profesor asignado", {
      description: `${found.name} fue notificado en ${found.email}.`,
    });
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

  const handleAssignMultiple = () => {
    if (selectedProfessors.length === 0) {
      toast.error("Selecciona al menos un profesor");
      return;
    }
    setAssignedProfessor(selectedProfessors[0]);
    toast.success(
      `${selectedProfessors.length} profesor${selectedProfessors.length === 1 ? "" : "es"} asignado${selectedProfessors.length === 1 ? "" : "s"}`,
      {
        description:
          "Los profesores fueron notificados para iniciar el desarrollo.",
      },
    );
  };

  const handleApprove = () => {
    setStatus("aprobada");
    toast.success(
      "Se ha notificado al líder de producto que la propuesta ha sido aprobada",
    );
  };

  const handleSubmitAdjust = () => {
    if (!adjustReason.trim()) {
      toast.error("Indica el motivo del ajuste");
      return;
    }
    setStatus("ajustes");
    setAdjustOpen(false);
    setAdjustReason("");
    toast.success("Propuesta enviada a ajustes", {
      description:
        "Se ha notificado al líder de producto para realizar los cambios solicitados.",
    });
  };

  return (
    <AppShell role="Líder de Centro">
      <div>
        <Link
          to="/nodo/propuestas"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a propuestas
        </Link>

        {/* Header */}
        <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-card p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Centro · {CURRENT_NODE.name}
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {p.id}
            </p>
            <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight">
              {p.title}
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
                {p.type}
              </span>
              <DeadlineBucketBadge bucket={getDeadlineBucket(p.deadline)} />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {isAprobacion && (
              <>
                <Button onClick={handleApprove}>
                  <ThumbsUp className="h-4 w-4" /> Aprobar propuesta
                </Button>
                <Button variant="outline" onClick={() => setAdjustOpen(true)}>
                  <RotateCcw className="h-4 w-4" /> Enviar a ajustes
                </Button>
              </>
            )}
            <Button asChild variant="outline">
              <Link to={`/ldp/propuestas/${p.id}/resumen`}>
                <Eye className="h-4 w-4" /> Ver detalles
              </Link>
            </Button>
          </div>
        </div>

        {/* Alert: En ajustes */}
        {status === "ajustes" && p.adjustmentReason && (
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
                  {p.adjustmentBy ? `Solicitado por ${p.adjustmentBy}` : ""}
                  {p.adjustmentAt
                    ? ` · ${format(new Date(p.adjustmentAt), "d MMM yyyy", { locale: es })}`
                    : ""}
                </p>
                <p className="mt-3 whitespace-pre-line text-sm text-foreground">
                  {p.adjustmentReason}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Alert: Rechazada */}
        {status === "rechazada" && p.rejectionReason && (
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
                  {p.rejectedBy ? `Cliente: ${p.rejectedBy}` : ""}
                  {p.rejectedAt
                    ? ` · ${format(new Date(p.rejectedAt), "d MMM yyyy", { locale: es })}`
                    : ""}
                </p>
                <p className="mt-3 whitespace-pre-line text-sm text-foreground">
                  {p.rejectionReason}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Disclaimer: Por aprobar */}
        {isAprobacion && (
          <section className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Info className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-foreground">
                  Por aprobar
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Esta propuesta está esperando tu aprobación para ser enviada
                  al KAM. Revisa los detalles y decide si aprobarla o enviarla a
                  ajustes.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Disclaimer: Aprobada */}
        {isAprobada && (
          <section className="mt-4 rounded-md border border-success/30 bg-success/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-foreground">
                  Propuesta aprobada
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Esta propuesta fue aprobada, esperando a que el líder de
                  producto la envíe al KAM.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Meta grid — 4 cards */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Centro asignado", value: centroAsignado },
            {
              label: "Profesor asignado",
              value: assignedProfessor ?? "Sin asignar",
            },
            { label: "KAM responsable", value: p.kam },
            { label: "Líder de Producto", value: p.productLeader },
          ].map((m) => (
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

        {/* Asignación de profesor */}
        {isNuevo && (
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
                          {NODE_PROFESSORS.map((prof) => (
                            <SelectItem key={prof.name} value={prof.name}>
                              <span className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {prof.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {prof.email}
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
                            NODE_PROFESSORS.find(
                              (prof) => prof.name === pendingProfessor,
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
                    {NODE_PROFESSORS.map((prof) => {
                      const checked = selectedProfessors.includes(prof.name);
                      return (
                        <div key={prof.name} className="space-y-1.5">
                          <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                handleToggleProfessor(
                                  prof.name,
                                  e.target.checked,
                                )
                              }
                              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                            />
                            <span className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {prof.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {prof.email}
                              </span>
                            </span>
                          </label>
                          {checked && (
                            <div className="ml-6">
                              <Input
                                placeholder="Especifique la responsabilidad de este profesor"
                                value={
                                  professorResponsibilities[prof.name] ?? ""
                                }
                                onChange={(e) =>
                                  setProfessorResponsibilities((prev) => ({
                                    ...prev,
                                    [prof.name]: e.target.value,
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

        {/* Información básica + sidebar de costeo */}
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
              <InfoField label="Empresa" value={p.company} />
              <InfoField label="Solicitante" value={p.applicant} />
              <InfoField label="Tipo" value={p.type} />
              <InfoField label="Centro(s)" value={p.nodes?.join(", ") ?? "—"} />
              <InfoField
                label="Creada"
                value={format(new Date(p.createdAt), "d MMM yyyy", {
                  locale: es,
                })}
              />
              <InfoField
                label="Fecha de entrega"
                value={
                  p.deadline
                    ? format(new Date(p.deadline), "d MMM yyyy", { locale: es })
                    : "Sin fecha"
                }
              />
            </dl>

            {/* Documentos de propuesta */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Documentos de propuesta
              </h3>
              <div className="mt-2 space-y-2">
                {PROPOSAL_DOCS.map((d) => (
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
                        <p className="text-sm font-medium text-foreground">
                          {d.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {d.size} · {d.date}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Descargar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {showCosteoAside && (
            <aside>
              <div className="rounded-md border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Costeo final
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Costo total del programa (COP)
                </p>
                {p.totalCost != null ? (
                  <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
                    {formatCop(p.totalCost)}
                  </p>
                ) : (
                  <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
                    $52.000.000
                  </p>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Adjustment modal */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar a ajustes</DialogTitle>
            <DialogDescription>
              Indica el motivo por el cual se devuelve esta propuesta para que
              el líder de producto realice los cambios necesarios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="adjust-reason">Motivo del ajuste</Label>
            <Textarea
              id="adjust-reason"
              rows={5}
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Describe qué debe ajustarse en la propuesta…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitAdjust}>
              <RotateCcw className="h-4 w-4" /> Enviar a ajustes
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
