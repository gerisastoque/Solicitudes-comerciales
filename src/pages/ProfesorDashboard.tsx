import { Link } from "react-router-dom";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Layers,
  Clock,
  Send,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DeadlineBucketBadge } from "@/components/StatusBadge";
import {
  CURRENT_PROFESSOR,
  PROF_STATUS_META,
  getProfStatus,
  getProfessorProposals,
} from "@/lib/profesor-data";
import { getDeadlineBucket } from "@/lib/ldp-data";
import { cn } from "@/lib/utils";

export default function ProfesorDashboard() {
  const today = new Date();
  const props = getProfessorProposals();

  const byStatus = {
    nueva: props.filter((p) => getProfStatus(p) === "nueva"),
    elaboracion: props.filter((p) => getProfStatus(p) === "elaboracion"),
    enviada: props.filter((p) => getProfStatus(p) === "enviada"),
    ajuste: props.filter((p) => getProfStatus(p) === "ajuste"),
  };

  const proximas = props.filter((p) => {
    if (!p.deadline || getProfStatus(p) === "enviada") return false;
    const d = differenceInCalendarDays(new Date(p.deadline), today);
    return d >= 0 && d <= 2;
  });
  const vencidas = props.filter((p) => {
    if (!p.deadline || getProfStatus(p) === "enviada") return false;
    return differenceInCalendarDays(new Date(p.deadline), today) < 0;
  });

  const metrics = [
    { label: "Asignadas", value: props.length, icon: Layers, tone: "text-primary bg-primary/10" },
    { label: "Nuevas", value: byStatus.nueva.length, icon: Sparkles, tone: "text-accent bg-accent/10" },
    { label: "En elaboración", value: byStatus.elaboracion.length, icon: Clock, tone: "text-info bg-info/10" },
    { label: "Enviadas", value: byStatus.enviada.length, icon: Send, tone: "text-success bg-success/10" },
    { label: "En ajuste", value: byStatus.ajuste.length, icon: AlertTriangle, tone: "text-warning bg-warning/10" },
  ];

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
      key: "ajuste",
      title: "En ajuste",
      items: byStatus.ajuste,
      icon: AlertTriangle,
      tone: "border-warning/30 bg-warning/5",
      iconTone: "text-warning bg-warning/10",
    },
  ];

  return (
    <AppShell role="Profesor">
      <div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Profesor · {CURRENT_PROFESSOR.name}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">Inicio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Desarrolla las propuestas asignadas y envíalas al Líder de Producto cuando estén listas.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resumen ejecutivo
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
          <Link
            to="/profesor/propuestas"
            className="flex items-start gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-accent/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
              <Layers className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-foreground">Ver propuestas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tablero con todas tus propuestas asignadas por estado.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Ir al tablero <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
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
                          to={`/profesor/propuestas/${p.id}`}
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
                Propuestas prioritarias
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ordenadas por proximidad de fecha límite.
              </p>
            </div>
            <Link to="/profesor/propuestas" className="text-xs font-medium text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
            <ul className="divide-y divide-border">
              {props
                .filter((p) => getProfStatus(p) !== "enviada")
                .slice()
                .sort((a, b) => {
                  const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
                  const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
                  return da - db;
                })
                .slice(0, 6)
                .map((p) => {
                  const ps = getProfStatus(p)!;
                  const meta = PROF_STATUS_META[ps];
                  const days = p.deadline ? differenceInCalendarDays(new Date(p.deadline), today) : null;
                  const overdue = days !== null && days < 0;
                  const dueSoon = days !== null && days >= 0 && days <= 2;
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/profesor/propuestas/${p.id}`}
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
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.title}</p>
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
