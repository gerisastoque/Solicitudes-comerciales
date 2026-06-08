import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, FileType, Send, Printer, Edit3, Paperclip, XCircle, AlertTriangle, RotateCcw, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { MOCK_REQUESTS, formatCop, ADJUSTMENT_OWNER_META } from "@/lib/mock-data";

const DOCS = [
  { name: "Propuesta_Programa_Capacitacion_v2.pdf", size: "2.4 MB", date: "15/03/2026", type: "pdf" as const },
  { name: "Anexo_Cronograma.docx", size: "856 KB", date: "15/03/2026", type: "doc" as const },
];

const UPLOADED_DOCS = [
  { name: "Brief_Cliente.pdf", size: "1.2 MB", date: "12/03/2026", type: "pdf" as const },
  { name: "Requerimientos_Iniciales.docx", size: "640 KB", date: "12/03/2026", type: "doc" as const },
  { name: "Plan_Capacitacion.pdf", size: "2.1 MB", date: "13/03/2026", type: "pdf" as const },
];

const SUMMARY_SECTIONS = [
  {
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
    title: "Requerimiento",
    fields: [
      ["Tipo de requerimiento", "Capacitación"],
      ["Nombre para la solicitud", "Nombre del programa"],
      ["Horas de dedicación", "Más de 60"],
      ["Modalidad", "Híbrida"],
      ["Servicio de alimentación", "Sí"],
      ["Número de participantes", "1 - 5"],
      ["Área de los participantes", "Comercial"],
    ],
  },
  {
    title: "Formación previa",
    fields: [
      ["¿Han tenido formación previa?", "No"],
      ["Descripción", "—"],
    ],
  },
  {
    title: "Observaciones",
    fields: [["¿Alguna otra observación?", "—"]],
  },
];

function UploadedDocs() {
  return (
    <section className="mt-4 rounded-md border border-border bg-card p-5">
      <h2 className="border-b border-border pb-3 font-display text-base font-bold">Documentos subidos</h2>
      <div className="mt-4 space-y-2">
        {UPLOADED_DOCS.map((d) => (
          <div
            key={d.name}
            className="flex items-center justify-between rounded-md border border-border bg-background p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary text-muted-foreground">
                {d.type === "pdf" ? <FileText className="h-4 w-4" /> : <FileType className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.size} · {d.date}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Descargar</Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

export default function RequestDetail() {
  const { id } = useParams();
  const req = MOCK_REQUESTS.find((r) => r.id === id) ?? MOCK_REQUESTS[3];
  const isReady = req.status === "lista" || req.status === "entregada" || req.status === "ajustes" || req.status === "rechazada";
  const isDelivered = req.status === "entregada";
  const isPending = req.status === "lista";
  const isAdjustments = req.status === "ajustes";
  const isClientRejected = req.status === "rechazada";

  const clientEmail = `${slugify(req.applicant)}@${slugify(req.company).replace(/\./g, "")}.com`;
  const ccEmails = [
    `${slugify(req.kam)}@icesi.edu.co`,
    `${slugify(req.productLeader)}@icesi.edu.co`,
    req.professor ? `${slugify(req.professor)}@icesi.edu.co` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const defaultSubject = `Propuesta ${req.type} — ${req.title} (${req.id})`;
  const defaultBody = `Estimado(a) ${req.applicant},

Adjunto encontrará la propuesta correspondiente a la solicitud ${req.id} — "${req.title}".

Quedamos atentos a sus comentarios y aprobación para continuar con los siguientes pasos.

Cordial saludo,
${req.kam}
KAM — ICESI`;

  const [composerOpen, setComposerOpen] = useState(false);
  const [to, setTo] = useState(clientEmail);
  const [cc, setCc] = useState(ccEmails);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectMode, setRejectMode] = useState<"kam" | "cliente">("kam");

  const [addReasonOpen, setAddReasonOpen] = useState(false);
  const [pendingReason, setPendingReason] = useState("");
  const [rejectionReasonText, setRejectionReasonText] = useState(req.clientRejectionReason ?? "");

  const handleSend = () => {
    if (!to.trim()) {
      toast.error("Falta el destinatario");
      return;
    }
    setComposerOpen(false);
    toast.success("Solicitud enviada correctamente", {
      description: `Correo enviado a ${to}${cc ? ` con copia a ${cc}` : ""}.`,
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Indica el motivo");
      return;
    }
    setRejectOpen(false);
    if (rejectMode === "cliente") {
      toast.success("Propuesta marcada como rechazada por el cliente", {
        description: "Se registró el motivo del cliente. El historial se conserva.",
      });
    } else {
      toast.success("Propuesta enviada a ajustes", {
        description: `Se notificó a ${req.productLeader} (Líder de Producto) con tu retroalimentación.`,
      });
    }
    setRejectReason("");
  };

  const handleSaveRejectionReason = () => {
    setRejectionReasonText(pendingReason.trim());
    setAddReasonOpen(false);
    toast.success("Motivo guardado");
  };

  const meta = [
    { label: "Centro asignado", value: req.node },
    { label: "Líder de Producto", value: req.productLeader },
    { label: "KAM responsable", value: req.kam },
    { label: "Profesor", value: req.professor ?? "Sin asignar" },
  ];

  return (
    <AppShell>
      <div>
        <Link to="/solicitudes" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a solicitudes
        </Link>

        {/* Header */}
        <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-card p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-muted-foreground">{req.id}</p>
            <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight">{req.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={req.status} />
              <span className="rounded border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {req.type}
              </span>
              <span className="text-xs text-muted-foreground">
                Creada {format(new Date(req.createdAt), "d MMM yyyy", { locale: es })}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {isReady ? (
              <Button variant="outline" asChild>
                <Link to={`/solicitudes/${req.id}/resumen`}>Ver detalles</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button asChild>
                  <Link to={`/solicitudes/nueva?edit=${req.id}`}>
                    <Edit3 className="h-4 w-4" /> Editar
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Disclaimer: En ajustes (interno) */}
        {isAdjustments && (
          <section className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-foreground">Propuesta en ajustes</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Acción pendiente: <span className="font-medium text-foreground">
                    {req.adjustmentOwner ? ADJUSTMENT_OWNER_META[req.adjustmentOwner].label : "Líder de Producto"}
                  </span>
                  {req.adjustmentBy ? ` · Devuelta por ${req.adjustmentBy}` : ""}
                  {req.adjustmentAt ? ` · ${format(new Date(req.adjustmentAt), "d MMM yyyy", { locale: es })}` : ""}
                </p>
                {req.adjustmentReason && (
                  <p className="mt-3 text-sm text-foreground whitespace-pre-line">{req.adjustmentReason}</p>
                )}
                {req.adjustmentOwner === "ldp" && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    La propuesta fue enviada a ajustes por el KAM y está pendiente de actualización por parte del Líder de Producto.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Disclaimer: Rechazada por el cliente */}
        {isClientRejected && (
          <section className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <XCircle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold text-destructive">Rechazada por el cliente</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  El cliente decidió no continuar con la propuesta. El historial se conserva.
                  {req.clientRejectedAt ? ` · ${format(new Date(req.clientRejectedAt), "d MMM yyyy", { locale: es })}` : ""}
                </p>
                {rejectionReasonText && (
                  <p className="mt-3 text-sm text-foreground whitespace-pre-line">{rejectionReasonText}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Meta grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((m) => (
            <div key={m.label} className="rounded-md border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>

        {isReady ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {/* Basic info */}
            <section className="lg:col-span-2 rounded-md border border-border bg-card p-5">
              <div className="border-b border-border pb-3">
                <h2 className="font-display text-base font-bold">Información básica</h2>
                <p className="text-xs text-muted-foreground">Datos de la solicitud</p>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Info label="Empresa" value={req.company} />
                <Info label="Tipo de empresa" value="Privada" />
                <Info label="Sector" value="Financiero" />
                <Info label="Solicitante" value={req.applicant} />
                <Info label="Modalidad" value="Híbrida" />
                <Info label="Participantes" value="11 - 15" />
                <Info label="Horas estimadas" value="60 horas" />
                <Info label="Servicio de alimentación" value="Sí" />
              </dl>

              {/* Documents */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Documentos de propuesta
                </h3>
                <div className="mt-2 space-y-2">
                  {DOCS.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between rounded-md border border-border bg-background p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary text-muted-foreground">
                          {d.type === "pdf" ? <FileText className="h-4 w-4" /> : <FileType className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.size} · {d.date}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Descargar</Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Cost + actions */}
            <aside className="space-y-4">
              <div className="rounded-md border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Costeo final</p>
                <p className="mt-1 text-xs text-muted-foreground">Costo total del programa (COP)</p>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
                  {formatCop(req.totalCostCop ?? 4_000_000)}
                </p>
              </div>

              {isPending && (
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => setComposerOpen(true)}>
                    <Send className="h-4 w-4" /> Enviar al cliente
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-warning hover:text-warning"
                    onClick={() => { setRejectMode("kam"); setRejectOpen(true); }}
                  >
                    <RotateCcw className="h-4 w-4" /> Enviar a ajustes
                  </Button>
                </div>
              )}
              {isAdjustments && (
                <div className="space-y-2">
                  <Button className="w-full" asChild>
                    <Link to={`/solicitudes/nueva?edit=${req.id}`}>
                      <Pencil className="h-4 w-4" /> Realizar ajustes
                    </Link>
                  </Button>
                </div>
              )}
              {isDelivered && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full text-warning hover:text-warning"
                    onClick={() => { setRejectMode("kam"); setRejectOpen(true); }}
                  >
                    <RotateCcw className="h-4 w-4" /> Enviar a ajustes
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => { setRejectMode("cliente"); setRejectOpen(true); }}
                  >
                    <XCircle className="h-4 w-4" /> El cliente ha rechazado esta propuesta
                  </Button>
                </div>
              )}
              {isClientRejected && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setPendingReason(rejectionReasonText); setAddReasonOpen(true); }}
                  >
                    {rejectionReasonText ? "Editar motivo del rechazo" : "Agregar motivo del rechazo"}
                  </Button>
                </div>
              )}
            </aside>
          </div>
        ) : (
          /* Summary-style view (no docs, no costo) */
          <div className="mt-4 space-y-4">
            {SUMMARY_SECTIONS.map((s) => (
              <section key={s.title} className="rounded-md border border-border bg-card p-5">
                <h2 className="border-b border-border pb-3 font-display text-base font-bold">{s.title}</h2>
                <dl className="mt-4 divide-y divide-border">
                  {s.fields.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-3 sm:gap-4">
                      <dt className="text-xs font-medium text-muted-foreground sm:col-span-1">{label}</dt>
                      <dd className="text-sm text-foreground sm:col-span-2">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}

        {/* Documentos subidos — hidden for "lista" and "entregada" (shown in Ver detalles instead) */}
        {!isReady && <UploadedDocs />}
      </div>

      {/* Email composer */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar propuesta al cliente</DialogTitle>
            <DialogDescription>
              Revisa el destinatario, copia y mensaje. La propuesta ya está adjunta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="to">Para</Label>
              <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cc">CC</Label>
              <Input id="cc" value={cc} onChange={(e) => setCc(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="subject">Asunto</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="body">Mensaje</Label>
              <Textarea
                id="body"
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Adjuntos
              </p>
              <div className="space-y-2">
                {DOCS.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-3 rounded-md border border-border bg-background p-2.5"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-muted-foreground">
                      <Paperclip className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposerOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" /> Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Motivo del rechazo */}
      <Dialog open={addReasonOpen} onOpenChange={setAddReasonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectionReasonText ? "Editar motivo del rechazo" : "Agregar motivo del rechazo"}
            </DialogTitle>
            <DialogDescription>
              Registra el motivo por el cual el cliente rechazó la propuesta. Este texto será visible para el Líder de Producto y el Líder de Centro como referencia del historial.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="rejection-reason">Motivo del rechazo</Label>
            <Textarea
              id="rejection-reason"
              rows={5}
              value={pendingReason}
              onChange={(e) => setPendingReason(e.target.value)}
              placeholder="Describe el motivo por el cual el cliente rechazó la propuesta…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddReasonOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveRejectionReason}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject proposal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectMode === "cliente"
                ? "El cliente ha rechazado la propuesta"
                : "Enviar a ajustes"}
            </DialogTitle>
            <DialogDescription>
              {rejectMode === "cliente"
                ? "Registra el motivo del cliente. La propuesta quedará marcada como rechazada por el cliente. No se eliminará el historial."
                : "La solicitud volverá al Líder de Producto con tu retroalimentación. Quedará en estado “En ajustes” mientras se resuelve. No se eliminará el historial."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="reason">
              {rejectMode === "cliente" ? "Motivo del cliente" : "Motivo del ajuste"}
            </Label>
            <Textarea
              id="reason"
              rows={5}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={
                rejectMode === "cliente"
                  ? "Describe la razón que entregó el cliente…"
                  : "Describe qué debe ajustarse en la propuesta…"
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={rejectMode === "cliente" ? "destructive" : "default"}
              onClick={handleReject}
            >
              {rejectMode === "cliente" ? "Registrar rechazo" : "Enviar a ajustes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
