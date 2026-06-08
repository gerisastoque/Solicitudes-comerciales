import { Link } from "react-router-dom";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  GraduationCap,
  Users,
  Layers,
  Clock,
  Send,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DeadlineBucketBadge } from "@/components/StatusBadge";
import {
  CURRENT_NODE,
  NODE_PROFESSORS,
  NODE_PROPOSALS,
  getProposalsForProfessor,
} from "@/lib/nodo-data";
import { LDP_STATUS_META, getDeadlineBucket } from "@/lib/ldp-data";
import { cn } from "@/lib/utils";

export default function NodoDashboard() {
  const today = new Date();

  const totalProfesores = NODE_PROFESSORS.length;
  const activas = NODE_PROPOSALS.filter((p) => p.status !== "rechazada").length;
  const elaboracion = NODE_PROPOSALS.filter((p) => p.status === "proceso").length;
  const entregadas = NODE_PROPOSALS.filter((p) => p.status === "entregada").length;
  const porAsignar = NODE_PROPOSALS.filter((p) => p.status === "nuevo").length;

  const metrics = [
    { label: "Profesores del centro", value: totalProfesores, icon: Users, tone: "text-accent bg-accent/10" },
    { label: "Propuestas activas", value: activas, icon: Layers, tone: "text-primary bg-primary/10" },
    { label: "En elaboración", value: elaboracion, icon: Clock, tone: "text-info bg-info/10" },
    { label: "Entregadas", value: entregadas, icon: Send, tone: "text-success bg-success/10" },
  ];

  const vencidas = NODE_PROPOSALS.filter((p) => {
    if (!p.deadline || p.status === "rechazada" || p.status === "entregada") return false;
    return differenceInCalendarDays(new Date(p.deadline), today) < 0;
  });
  const proximas = NODE_PROPOSALS.filter((p) => {
    if (!p.deadline || p.status === "rechazada" || p.status === "entregada") return false;
    const d = differenceInCalendarDays(new Date(p.deadline), today);
    return d >= 0 && d <= 2;
  });
  const requierenAjuste = NODE_PROPOSALS.filter((p) => p.status === "ajustes");

  const alerts = [
    {
      key: "vencidas",
      title: "Propuestas vencidas",
      items: vencidas,
      icon: XCircle,
      tone: "border-destructive/30 bg-destructive/5",
      iconTone: "text-destructive bg-destructive/10",
    },
    {
      key: "proximas",
      title: "Próximas a vencer",
      items: proximas,
      icon: Clock,
      tone: "border-warning/30 bg-warning/5",
      iconTone: "text-warning bg-warning/10",
    },
    {
      key: "ajustes",
      title: "Requieren ajustes",
      items: requierenAjuste,
      icon: AlertTriangle,
      tone: "border-warning/30 bg-warning/5",
      iconTone: "text-warning bg-warning/10",
    },
  ];

  const byProfessor = NODE_PROFESSORS.map((prof) => {
    const items = getProposalsForProfessor(prof.name);
    return {
      ...prof,
      total: items.length,
      proceso: items.filter((x) => x.status === "proceso").length,
      entregada: items.filter((x) => x.status === "entregada").length,
      ajustes: items.filter((x) => x.status === "ajustes").length,
      rechazada: items.filter((x) => x.status === "rechazada").length,
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <AppShell role="Líder de Centro">
      <div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Centro · {CURRENT_NODE.name}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">Inicio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Asigna profesores, haz seguimiento del avance y valida el estado de las propuestas del centro.
          </p>
        </div>

        {porAsignar > 0 && (
          <div className="mt-5 flex flex-col items-start gap-3 rounded-md border border-accent/30 bg-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {porAsignar} propuesta{porAsignar > 1 ? "s" : ""} sin profesor asignado
                </p>
                <p className="text-xs text-muted-foreground">
                  Asígnale un profesor del centro para que comience la elaboración.
                </p>
              </div>
            </div>
            <Link
              to="/nodo/propuestas?columna=nuevo"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              Asignar ahora <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <div className="mt-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen del centro
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", s.tone)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{s.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Alertas y seguimiento
          </h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {alerts.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.key} className={cn("rounded-md border p-4", a.tone)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", a.iconTone)}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    </div>
                    <span className="rounded bg-card px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {a.items.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {a.items.length === 0 ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-success" /> Sin pendientes
                      </p>
                    ) : (
                      a.items.slice(0, 3).map((p) => (
                        <Link
                          key={p.id}
                          to={`/nodo/propuestas/${p.id}`}
                          className="flex items-center justify-between gap-2 rounded border border-border bg-card px-2 py-1.5 text-xs hover:bg-secondary"
                        >
                          <span className="truncate font-medium text-foreground">{p.company}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {p.deadline ? format(new Date(p.deadline), "d MMM", { locale: es }) : "—"}
                          </span>
                        </Link>
                      ))
                    )}
                    {a.items.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{a.items.length - 3} más</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Profesores del centro
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Consulta el detalle de cada profesor y sus propuestas asignadas.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byProfessor.map((p) => (
              <Link
                key={p.slug}
                to={`/nodo/profesores/${p.slug}`}
                className="rounded-md border border-border bg-card p-4 transition-colors hover:border-accent/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                      </div>
                    </div>
                  </div>
                  <p className="font-display text-2xl font-bold tracking-tight text-foreground">{p.total}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3 text-[11px]">
                  <span className="rounded border border-info/20 bg-info/10 px-1.5 py-0.5 font-medium text-info">
                    En proceso · {p.proceso}
                  </span>
                  <span className="rounded border border-success/20 bg-success/10 px-1.5 py-0.5 font-medium text-success">
                    Entregadas · {p.entregada}
                  </span>
                  {p.ajustes > 0 && (
                    <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-medium text-warning">
                      Ajustes · {p.ajustes}
                    </span>
                  )}
                  {p.rechazada > 0 && (
                    <span className="rounded border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">
                      Rechazadas · {p.rechazada}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Propuestas prioritarias
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ordenadas por urgencia y proximidad de fecha límite.
              </p>
            </div>
            <Link to="/nodo/propuestas" className="text-xs font-medium text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
            <ul className="divide-y divide-border">
              {NODE_PROPOSALS
                .filter((p) => p.status !== "rechazada")
                .slice()
                .sort((a, b) => {
                  const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
                  const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
                  return da - db;
                })
                .slice(0, 6)
                .map((p) => {
                  const days = p.deadline ? differenceInCalendarDays(new Date(p.deadline), today) : null;
                  const overdue = days !== null && days < 0;
                  const dueSoon = days !== null && days >= 0 && days <= 2;
                  const meta = LDP_STATUS_META[p.status];
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/nodo/propuestas/${p.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-secondary/40 px-2 py-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span
                            className={cn(
                              "mt-0.5 text-[11px] font-semibold",
                              overdue ? "text-destructive" : dueSoon ? "text-warning" : "text-foreground",
                            )}
                          >
                            {p.deadline ? format(new Date(p.deadline), "d MMM", { locale: es }) : "Sin fecha"}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-foreground">{p.company}</span>
                            <DeadlineBucketBadge bucket={getDeadlineBucket(p.deadline)} />
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {p.professor ? `Profesor: ${p.professor}` : "Sin profesor asignado"} · {p.title}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "hidden sm:inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
                            meta.tone,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                          {meta.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
