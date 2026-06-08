import { Link } from "react-router-dom";
import { Layers, Clock, CheckCircle2, XCircle, ArrowRight, Calendar, GraduationCap, Send, AlertTriangle } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { AppShell } from "@/components/AppShell";
import { DeadlineBucketBadge } from "@/components/StatusBadge";
import { MOCK_LDP_PROPOSALS, LDP_STATUS_META, PROFESSOR_DIRECTORY, getDeadlineBucket } from "@/lib/ldp-data";
import { cn } from "@/lib/utils";

export default function LdpDashboard() {
  const today = new Date();

  const nuevos = MOCK_LDP_PROPOSALS.filter((p) => p.status === "nuevo").length;
  const proceso = MOCK_LDP_PROPOSALS.filter((p) => p.status === "proceso").length;
  const costeo = MOCK_LDP_PROPOSALS.filter((p) => p.status === "costeo").length;
  const entregadas = MOCK_LDP_PROPOSALS.filter((p) => p.status === "entregada").length;
  const ajustes = MOCK_LDP_PROPOSALS.filter((p) => p.status === "ajustes").length;
  const rechazadas = MOCK_LDP_PROPOSALS.filter((p) => p.status === "rechazada").length;

  // Resumen por profesor: cuántas propuestas tiene asignadas cada uno.
  const byProfessor = PROFESSOR_DIRECTORY.map((p) => {
    const items = MOCK_LDP_PROPOSALS.filter((x) => x.professor === p.name);
    return {
      name: p.name,
      email: p.email,
      total: items.length,
      proceso: items.filter((x) => x.status === "proceso").length,
      costeo: items.filter((x) => x.status === "costeo").length,
      ajustes: items.filter((x) => x.status === "ajustes").length,
      rechazada: items.filter((x) => x.status === "rechazada").length,
    };
  }).sort((a, b) => b.total - a.total);

  const exec = [
    { label: "Por asignar profesor", value: nuevos, icon: Layers, tone: "text-accent bg-accent/10" },
    { label: "Propuesta en elaboración", value: proceso, icon: Clock, tone: "text-info bg-info/10" },
    { label: "Lista para costeo", value: costeo, icon: CheckCircle2, tone: "text-success bg-success/10" },
    { label: "Entregada a KAM", value: entregadas, icon: Send, tone: "text-primary bg-primary/10" },
    { label: "En ajustes", value: ajustes, icon: AlertTriangle, tone: "text-warning bg-warning/10" },
    { label: "Rechazadas por cliente", value: rechazadas, icon: XCircle, tone: "text-destructive bg-destructive/10" },
  ];

  const bucketRank: Record<string, number> = { urgente: 0, proximo: 1, sinfecha: 3 };
  const prioritized = MOCK_LDP_PROPOSALS.filter((p) => p.status !== "rechazada")
    .slice()
    .sort((a, b) => {
      const ra = bucketRank[getDeadlineBucket(a.deadline) ?? "atiempo"] ?? 2;
      const rb = bucketRank[getDeadlineBucket(b.deadline) ?? "atiempo"] ?? 2;
      if (ra !== rb) return ra - rb;
      const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
      const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    })
    .slice(0, 6);

  return (
    <AppShell role="Líder de Producto">
      <div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Inicio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Construye propuestas, asigna profesores y prepara el costeo.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Resumen ejecutivo
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {exec.map((s) => {
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
            to="/ldp/propuestas"
            className="flex items-start gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-accent/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
              <Layers className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-foreground">Ver propuestas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tablero con todas las propuestas asignadas por estado.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Ir al tablero <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        </div>

        {/* Resumen por profesor */}
        <div className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Resumen por profesor
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Propuestas asignadas a cada profesor.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byProfessor.map((p) => (
              <div key={p.name} className="rounded-md border border-border bg-card p-4">
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
                    Costeo · {p.costeo}
                  </span>
                  {p.ajustes > 0 && (
                    <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-medium text-warning">
                      En ajustes · {p.ajustes}
                    </span>
                  )}
                  {p.rechazada > 0 && (
                    <span className="rounded border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">
                      Rechazadas · {p.rechazada}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Propuestas prioritarias
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ordenadas por urgencia y proximidad de fecha límite.
              </p>
            </div>
            <Link to="/ldp/propuestas" className="text-xs font-medium text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
            {prioritized.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No hay propuestas activas.</div>
            ) : (
              <ul className="divide-y divide-border">
                {prioritized.map((p) => {
                  const days = p.deadline ? differenceInCalendarDays(new Date(p.deadline), today) : null;
                  const overdue = days !== null && days < 0;
                  const dueSoon = days !== null && days >= 0 && days <= 2;
                  const meta = LDP_STATUS_META[p.status];
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/ldp/propuestas/${p.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-secondary/40 px-2 py-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span
                            className={cn(
                              "mt-0.5 text-[11px] font-semibold",
                              overdue ? "text-destructive" : dueSoon ? "text-warning" : "text-foreground"
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
                            meta.tone
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
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
