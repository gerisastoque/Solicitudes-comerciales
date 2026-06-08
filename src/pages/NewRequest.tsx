import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Save, Send, Check, Building2, User,
  ClipboardList, GraduationCap, MessageSquare, CheckCircle2, X, Bell, Calendar,
  ChevronDown, Search, Upload, Paperclip, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { KAMS, NODES, PRODUCT_LEADERS, MOCK_REQUESTS, type RequestItem, type RequestStatus, type RequestType } from "@/lib/mock-data";

// Mock logged-in user (KAM) — read-only in the form
const CURRENT_KAM = KAMS[0];

// Pairs of producto leader · nodo for the merged multi-select
const LEADER_NODE_PAIRS: Array<{ leader: string; node: string }> = [
  { leader: PRODUCT_LEADERS[0], node: NODES[1] },
  { leader: PRODUCT_LEADERS[1], node: NODES[3] },
  { leader: PRODUCT_LEADERS[2], node: NODES[2] },
  { leader: PRODUCT_LEADERS[3], node: NODES[0] },
  { leader: PRODUCT_LEADERS[1], node: NODES[4] },
];

// Mock company "database" — used by the "Buscar empresa" autocomplete
const COMPANY_DB: Array<{
  nombre: string;
  descripcion: string;
  tipoEmpresa: "Pública" | "Privada" | "Mixta" | "Sin ánimo de lucro";
  sector: string;
  web: string;
}> = [
  { nombre: "Bancolombia", descripcion: "Grupo financiero líder en Colombia con operación regional.", tipoEmpresa: "Privada", sector: "Financiero", web: "https://www.bancolombia.com" },
  { nombre: "Grupo Éxito", descripcion: "Cadena de retail con presencia en Latinoamérica.", tipoEmpresa: "Privada", sector: "Retail", web: "https://www.grupoexito.com.co" },
  { nombre: "Postobón", descripcion: "Compañía de bebidas con amplia distribución nacional.", tipoEmpresa: "Privada", sector: "Bebidas / Consumo masivo", web: "https://www.postobon.com" },
  { nombre: "Sura", descripcion: "Compañía de seguros y servicios financieros.", tipoEmpresa: "Privada", sector: "Seguros", web: "https://www.sura.com" },
  { nombre: "Nutresa", descripcion: "Multinacional de alimentos procesados.", tipoEmpresa: "Privada", sector: "Alimentos", web: "https://www.gruponutresa.com" },
  { nombre: "Cementos Argos", descripcion: "Productor de cemento y concreto en las Américas.", tipoEmpresa: "Privada", sector: "Materiales / Construcción", web: "https://www.argos.co" },
  { nombre: "Ecopetrol", descripcion: "Empresa estatal de petróleo y energía de Colombia.", tipoEmpresa: "Mixta", sector: "Energía / Hidrocarburos", web: "https://www.ecopetrol.com.co" },
  { nombre: "Alcaldía de Cali", descripcion: "Entidad pública territorial de Santiago de Cali.", tipoEmpresa: "Pública", sector: "Gobierno", web: "https://www.cali.gov.co" },
  { nombre: "Fundación WWB Colombia", descripcion: "Organización sin ánimo de lucro enfocada en inclusión financiera.", tipoEmpresa: "Sin ánimo de lucro", sector: "Desarrollo social", web: "https://www.fundacionwwbcolombia.org" },
];

const STEPS = [
  { id: 1, title: "Empresa", icon: Building2 },
  { id: 2, title: "Contacto", icon: User },
  { id: 3, title: "Requerimiento", icon: ClipboardList },
  { id: 4, title: "Formación previa", icon: GraduationCap },
  { id: 5, title: "Observaciones", icon: MessageSquare },
];

type FormValue = string | string[];
type FormData = Record<string, FormValue>;

const asString = (v: FormValue | undefined) => (typeof v === "string" ? v : "");
const asArray = (v: FormValue | undefined) => (Array.isArray(v) ? v : []);

export default function NewRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>({ kam: CURRENT_KAM, plazoEntrega: "5" });
  const [submitted, setSubmitted] = useState<null | "draft" | "sent" | "updated">(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Prefill in edit mode from MOCK_REQUESTS
  useEffect(() => {
    if (!editId) return;
    const req = MOCK_REQUESTS.find((r) => r.id === editId);
    if (!req) return;
    setData({
      kam: req.kam,
      empresa: req.company,
      leaderNodos: [`${req.productLeader} · ${req.node}`],
      plazoEntrega: "5",
      nombreReq: req.title,
      tipoReq: req.type,
      contactoNombre: req.applicant,
    });
  }, [editId]);

  const update = (k: string, v: FormValue) => setData((d) => ({ ...d, [k]: v }));
  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const persistRequest = (status: RequestStatus) => {
    const leaderNodos = asArray(data.leaderNodos);
    const firstPair = leaderNodos[0]?.split(" · ") ?? [];
    const productLeader = firstPair[0] ?? PRODUCT_LEADERS[0];
    const node = firstPair[1] ?? NODES[0];
    const company = asString(data.empresa) || "Sin empresa";
    const companyMatch = COMPANY_DB.find((c) => c.nombre === company);
    const companyLogo = companyMatch
      ? `https://logo.clearbit.com/${new URL(companyMatch.web).hostname.replace(/^www\./, "")}`
      : undefined;
    const plazoDias = parseInt(asString(data.plazoEntrega) || "5", 10);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (isNaN(plazoDias) ? 5 : plazoDias));

    if (editId) {
      const idx = MOCK_REQUESTS.findIndex((r) => r.id === editId);
      if (idx >= 0) {
        MOCK_REQUESTS[idx] = {
          ...MOCK_REQUESTS[idx],
          title: asString(data.nombreReq) || MOCK_REQUESTS[idx].title,
          type: (asString(data.tipoReq) as RequestType) || MOCK_REQUESTS[idx].type,
          applicant: asString(data.contactoNombre) || MOCK_REQUESTS[idx].applicant,
          company,
          companyLogo: companyLogo ?? MOCK_REQUESTS[idx].companyLogo,
          node,
          productLeader,
          kam: asString(data.kam) || MOCK_REQUESTS[idx].kam,
          status,
        };
      }
      return;
    }

    const newReq: RequestItem = {
      id: `REQ-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      title: asString(data.nombreReq) || "Nueva solicitud",
      applicant: asString(data.contactoNombre) || "Sin asignar",
      type: (asString(data.tipoReq) as RequestType) || "Capacitación",
      createdAt: new Date().toISOString().slice(0, 10),
      deadline: status === "borrador" ? undefined : deadline.toISOString().slice(0, 10),
      status,
      urgency: "media",
      priority: "media",
      company,
      companyLogo,
      node,
      productLeader,
      kam: asString(data.kam) || CURRENT_KAM,
    };
    MOCK_REQUESTS.unshift(newReq);
  };

  if (submitted) return <SuccessScreen kind={submitted} onClose={() => navigate("/solicitudes")} />;

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Top bar */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="font-display text-sm font-bold">{editId ? "Editar solicitud" : "Nueva solicitud"}</span>
          <Link to="/dashboard" className="rounded p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Stepper - all clickable */}
        <ol className="mb-6 flex flex-wrap items-center gap-2 sm:gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <li key={s.id} className="flex flex-1 items-center min-w-fit">
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  aria-current={active ? "step" : undefined}
                  className="group flex items-center gap-2.5 rounded-md px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                      done && "border-accent bg-accent text-accent-foreground",
                      active && "border-accent bg-card text-accent",
                      !done && !active && "border-border bg-card text-muted-foreground group-hover:border-accent/50 group-hover:text-foreground"
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm transition-colors sm:block",
                      active ? "font-semibold text-foreground" : done ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {s.title}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className={cn("mx-2 hidden h-px flex-1 sm:block", done ? "bg-accent" : "bg-border")} />
                )}
              </li>
            );
          })}
        </ol>

        <div className="rounded-md border border-border bg-card p-6 sm:p-8">
          {step === 1 && <Step1 data={data} update={update} />}
          {step === 2 && <Step2 data={data} update={update} />}
          {step === 3 && <Step3 data={data} update={update} />}
          {step === 4 && <Step4 data={data} update={update} />}
          {step === 5 && <Step5 data={data} update={update} />}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
            {step === 5 && (
              <Button variant="outline" onClick={() => { persistRequest("borrador"); setSubmitted("draft"); }}>
                <Save className="h-4 w-4" />
                Guardar borrador
              </Button>
            )}
            {step < 5 ? (
              <Button onClick={next}>
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => {
                if (editId) { persistRequest("nueva"); setSubmitted("updated"); }
                else { setConfirmOpen(true); }
              }}>
                <Send className="h-4 w-4" />
                {editId ? "Actualizar" : "Enviar solicitud"}
              </Button>
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envío</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que quieres enviar la solicitud? Esta será enviada inmediatamente al Líder de producto para ser desarrollada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { persistRequest("nueva"); setConfirmOpen(false); setSubmitted("sent"); }}>
              Enviar solicitud
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -------------- Steps -------------- */

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 border-b border-border pb-4">
      <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function RadioGroup({
  options, value, onChange, columns = 2,
}: { options: string[]; value?: string; onChange: (v: string) => void; columns?: number }) {
  return (
    <div className={cn("grid gap-2", columns === 2 ? "sm:grid-cols-2" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4")}>
      {options.map((o) => {
        const sel = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
              sel
                ? "border-accent bg-accent/5 text-foreground"
                : "border-border bg-card text-foreground hover:border-accent/50"
            )}
          >
            <span
              className={cn(
                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                sel ? "border-accent" : "border-border"
              )}
            >
              {sel && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
            </span>
            {o}
          </button>
        );
      })}
    </div>
  );
}

type StepProps = { data: FormData; update: (k: string, v: FormValue) => void };

function CompanyAutocomplete({ data, update }: StepProps) {
  const [open, setOpen] = useState(false);
  const query = asString(data.empresa);
  const matches = useMemo(() => {
    if (!query.trim()) return [] as typeof COMPANY_DB;
    const q = query.toLowerCase();
    return COMPANY_DB.filter((c) => c.nombre.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const pick = (c: (typeof COMPANY_DB)[number]) => {
    update("empresa", c.nombre);
    update("descripcion", c.descripcion);
    update("tipoEmpresa", c.tipoEmpresa);
    update("sector", c.sector);
    update("web", c.web);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar empresa por nombre..."
        value={query}
        onChange={(e) => {
          update("empresa", e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="pl-9"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          <ul className="max-h-60 overflow-auto py-1">
            {matches.map((c) => (
              <li key={c.nombre}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span className="font-medium text-foreground">{c.nombre}</span>
                  <span className="text-xs text-muted-foreground">{c.sector} · {c.tipoEmpresa}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RequestNameAutocomplete({ data, update }: StepProps) {
  const [open, setOpen] = useState(false);
  const query = asString(data.nombreReq);
  const matches = useMemo(() => {
    if (!query.trim()) return [] as typeof MOCK_REQUESTS;
    const q = query.toLowerCase();
    return MOCK_REQUESTS.filter((r) => r.title.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  return (
    <div className="relative">
      <Input
        placeholder="Ej. Capacitación interna - Marketing"
        value={query}
        onChange={(e) => { update("nombreReq", e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          <ul className="max-h-60 overflow-auto py-1">
            {matches.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { update("nombreReq", r.title); setOpen(false); }}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span className="font-medium text-foreground">{r.title}</span>
                  <span className="text-xs text-muted-foreground">{r.company} · {r.type}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LeaderNodeMultiSelect({ data, update }: StepProps) {
  const selected = asArray(data.leaderNodos);
  const toggle = (key: string) => {
    update("leaderNodos", selected.includes(key) ? selected.filter((s) => s !== key) : [...selected, key]);
  };
  const label =
    selected.length === 0
      ? "Selecciona uno o más líderes con su nodo"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} seleccionados`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>{label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        <ul className="max-h-72 overflow-auto">
          {LEADER_NODE_PAIRS.map((p) => {
            const key = `${p.leader} · ${p.node}`;
            const checked = selected.includes(key);
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-secondary"
                >
                  <Checkbox checked={checked} className="mt-0.5" />
                  <div className="flex flex-1 items-start justify-between gap-3 leading-snug">
                    <span className="font-medium text-foreground">{p.leader}</span>
                    <span className="text-right text-xs text-muted-foreground">{p.node}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function Step1({ data, update }: StepProps) {
  // Empresa step
  return (
    <div>
      <SectionHeader title="Empresa" description="Información del cliente que solicita el servicio." />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nombre del KAM" required>
          <Input value={asString(data.kam) || CURRENT_KAM} readOnly disabled className="bg-muted/50" />
        </Field>
        <Field label="Buscar empresa" required hint="Selecciona una empresa existente para autocompletar sus datos.">
          <CompanyAutocomplete data={data} update={update} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Descripción breve de la empresa" required>
            <Textarea rows={3} placeholder="Descripción breve" value={asString(data.descripcion)} onChange={(e) => update("descripcion", e.target.value)} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="La empresa es" required>
            <RadioGroup
              options={["Pública", "Privada", "Mixta", "Sin ánimo de lucro"]}
              value={asString(data.tipoEmpresa)}
              onChange={(v) => update("tipoEmpresa", v)}
              columns={4}
            />
          </Field>
        </div>
        <Field label="Sector o industria">
          <Input placeholder="Ej. Financiero" value={asString(data.sector)} onChange={(e) => update("sector", e.target.value)} />
        </Field>
        <Field label="Página web">
          <Input placeholder="https://" value={asString(data.web)} onChange={(e) => update("web", e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Líder de producto y nodo" required hint="Puedes seleccionar uno o varios nodos con su líder correspondiente">
            <LeaderNodeMultiSelect data={data} update={update} />
          </Field>
        </div>
        <Field label="Plazo de entrega al cliente" required>
          <Select value={asString(data.plazoEntrega) || "5"} onValueChange={(v) => update("plazoEntrega", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["5", "4", "3", "2", "1"].map((d) => (
                <SelectItem key={d} value={d}>{d} {d === "1" ? "día" : "días"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Prioridad" required hint="Define la urgencia del requerimiento, independiente de la fecha.">
          <Select value={asString(data.prioridad) || "media"} onValueChange={(v) => update("prioridad", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alta">Alta / Urgente</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Step2({ data, update }: StepProps) {
  return (
    <div>
      <SectionHeader title="Contacto" description="Datos del cliente que realiza la solicitud" />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nombre" required>
          <Input placeholder="Ingrese nombre" value={asString(data.contactoNombre)} onChange={(e) => update("contactoNombre", e.target.value)} />
        </Field>
        <Field label="Teléfono" required>
          <Input placeholder="Ingrese teléfono" value={asString(data.telefono)} onChange={(e) => update("telefono", e.target.value)} />
        </Field>
        <Field label="Correo institucional" required>
          <Input type="email" placeholder="nombre@empresa.com" value={asString(data.correo)} onChange={(e) => update("correo", e.target.value)} />
        </Field>
        <Field label="Cargo">
          <Input placeholder="Ingrese cargo" value={asString(data.cargo)} onChange={(e) => update("cargo", e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Área o dependencia">
            <Input placeholder="Ingrese área" value={asString(data.area)} onChange={(e) => update("area", e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Step3({ data, update }: StepProps) {
  const tipoReq = asString(data.tipoReq);
  const alimentacion = asString(data.alimentacion);
  return (
    <div>
      <SectionHeader title="Requerimiento" description="Detalles del servicio solicitado." />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Tipo de requerimiento" required>
            <RadioGroup
              options={["Capacitación", "Consultoría", "Mentoría"]}
              value={tipoReq}
              onChange={(v) => update("tipoReq", v)}
              columns={3}
            />
          </Field>
        </div>
        {tipoReq === "Capacitación" && (
          <div className="md:col-span-2">
            <Field label="Tipo de capacitación" required>
              <Select value={asString(data.tipoCapacitacion)} onValueChange={(v) => update("tipoCapacitacion", v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona el tipo de capacitación" /></SelectTrigger>
                <SelectContent>
                  {["Charla", "Taller", "Curso", "Seminario", "Programa modular"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}
        <div className="md:col-span-2">
          <Field label="Número de participantes" required>
            <RadioGroup
              options={["1 - 5", "6 - 10", "11 - 15", "15 - 20", "20 - 25", "Otro"]}
              value={asString(data.participantes)}
              onChange={(v) => update("participantes", v)}
              columns={3}
            />
          </Field>
        </div>
        {asString(data.participantes) === "Otro" && (
          <div className="md:col-span-2">
            <Field label="Cantidad exacta de participantes" required>
              <Input
                type="number"
                min={1}
                placeholder="Ej. 32"
                value={asString(data.participantesOtro)}
                onChange={(e) => update("participantesOtro", e.target.value)}
              />
            </Field>
          </div>
        )}
        <div className="md:col-span-2">
          <Field label="Nombre para la solicitud" required>
            <RequestNameAutocomplete data={data} update={update} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="¿Cuál es la necesidad o problema que motiva esta solicitud?">
            <Textarea rows={3} placeholder="Ingrese información" value={asString(data.necesidad)} onChange={(e) => update("necesidad", e.target.value)} />
          </Field>
        </div>
        <Field label="Horas estimadas" hint="Ingrese solo números">
          <div className="space-y-2">
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={asString(data.horas)}
              disabled={asString(data.horasProfesor) === "si"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || Number(v) >= 0) update("horas", v);
              }}
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={asString(data.horasProfesor) === "si"}
                onCheckedChange={(c) => {
                  update("horasProfesor", c ? "si" : "");
                  if (c) update("horas", "");
                }}
              />
              <span>A decisión del profesor</span>
            </label>
          </div>
        </Field>
        <div className="md:col-span-2">
          <Field label="Modalidad del programa">
            <RadioGroup
              options={["Virtual", "Presencial en Icesi", "Presencial en cliente", "Presencial en otro lugar", "Híbrida"]}
              value={asString(data.modalidad)}
              onChange={(v) => update("modalidad", v)}
              columns={2}
            />
          </Field>
        </div>
        {asString(data.modalidad) === "Presencial en otro lugar" && (
          <div className="md:col-span-2">
            <Field label="Describe el lugar" required>
              <Input
                placeholder="Ej. Hotel Intercontinental, salón Bolívar"
                value={asString(data.modalidadOtroLugar)}
                onChange={(e) => update("modalidadOtroLugar", e.target.value)}
              />
            </Field>
          </div>
        )}
        <Field label="Servicio de alimentación">
          <RadioGroup options={["Sí", "No"]} value={alimentacion} onChange={(v) => update("alimentacion", v)} columns={2} />
        </Field>
        {alimentacion === "Sí" && (
          <Field label="Observaciones sobre el servicio">
            <Input placeholder="Ej: Barra de café incluida, desayuno, almuerzo" value={asString(data.obsComida)} onChange={(e) => update("obsComida", e.target.value)} />
          </Field>
        )}
        <div className="md:col-span-2">
          <Field label="¿Qué resultados espera lograr al finalizar?">
            <Textarea rows={2} value={asString(data.resultados)} onChange={(e) => update("resultados", e.target.value)} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="¿Cómo se medirá el éxito del proceso?">
            <Textarea rows={2} value={asString(data.exito)} onChange={(e) => update("exito", e.target.value)} />
          </Field>
        </div>
        <Field label="Competencias a fortalecer">
          <Input value={asString(data.competencias)} onChange={(e) => update("competencias", e.target.value)} />
        </Field>
        <Field label="Área de los participantes">
          <Input value={asString(data.areaParticipantes)} onChange={(e) => update("areaParticipantes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Step4({ data, update }: StepProps) {
  const tienePrevia = asString(data.formacionPrevia) === "Sí";
  return (
    <div>
      <SectionHeader title="Formación previa" description="Información sobre formación recibida anteriormente." />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="¿Han tenido formación previa?">
            <RadioGroup options={["Sí", "No"]} value={asString(data.formacionPrevia)} onChange={(v) => update("formacionPrevia", v)} columns={2} />
          </Field>
        </div>
        {tienePrevia && (
          <>
            <div className="md:col-span-2">
              <Field label="Descripción de la formación">
                <Textarea rows={3} placeholder="Ingrese nombre del programa" value={asString(data.descFormacion)} onChange={(e) => update("descFormacion", e.target.value)} />
              </Field>
            </div>
            <Field label="Empresa que dictó la formación">
              <Input value={asString(data.empresaPrevia)} onChange={(e) => update("empresaPrevia", e.target.value)} />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={asString(data.fechaPrevia)} onChange={(e) => update("fechaPrevia", e.target.value)} />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}

function Step5({ data, update }: StepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const archivos = asArray(data.archivos);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const names = Array.from(files).map((f) => f.name);
    update("archivos", [...archivos, ...names]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    update("archivos", archivos.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <SectionHeader title="Observaciones" description="Información adicional relevante para la solicitud." />
      <div className="space-y-5">
        <Field label="¿Alguna otra observación?">
          <Textarea rows={6} placeholder="Ingrese información" value={asString(data.observaciones)} onChange={(e) => update("observaciones", e.target.value)} />
        </Field>

        <Field label="Archivos y documentos" hint="Adjunta documentos de soporte, propuestas o referencias.">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-secondary/40 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
            >
              <Upload className="h-5 w-5" />
              <span><span className="font-medium text-foreground">Haz clic para subir</span> o arrastra archivos aquí</span>
              <span className="text-xs">PDF, DOCX, XLSX, imágenes — hasta 10 MB c/u</span>
            </button>

            {archivos.length > 0 && (
              <ul className="mt-3 space-y-2">
                {archivos.map((name, idx) => (
                  <li
                    key={`${name}-${idx}`}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm text-foreground">{name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
                      aria-label="Eliminar archivo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>
      </div>
    </div>
  );
}

/* -------------- Success -------------- */

function SuccessScreen({ kind, onClose }: { kind: "draft" | "sent" | "updated"; onClose: () => void }) {
  const isDraft = kind === "draft";
  const isUpdated = kind === "updated";
  const isSent = kind === "sent";
  const title = isDraft
    ? "Solicitud guardada"
    : isUpdated
      ? "Actualización realizada correctamente"
      : "Solicitud enviada correctamente";
  const description = isDraft
    ? "Tu borrador fue guardado. Puedes continuar editándolo más tarde."
    : isUpdated
      ? "Los cambios fueron guardados correctamente."
      : "La solicitud fue registrada y asignada correctamente.";
  return (
    <div className="min-h-screen bg-secondary/40">
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-md border border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

          {isSent && (
            <div className="mt-6 space-y-2 text-left">
              <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-3">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Fecha límite calculada</p>
                  <p className="text-xs text-muted-foreground">El sistema asignó la fecha límite.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-3">
                <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Alerta enviada al LDP</p>
                  <p className="text-xs text-muted-foreground">El líder de producto fue notificado.</p>
                </div>
              </div>
            </div>
          )}

          {isUpdated && (
            <div className="mt-6 space-y-2 text-left">
              <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-3">
                <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Alerta enviada al LDP</p>
                  <p className="text-xs text-muted-foreground">El líder de producto fue notificado.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" asChild><Link to="/dashboard">Ir al inicio</Link></Button>
            <Button onClick={onClose}>Ver solicitudes</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
