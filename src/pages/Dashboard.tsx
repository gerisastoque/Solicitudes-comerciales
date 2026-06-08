import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, ListChecks, ArrowRight, TrendingUp, Clock, CheckCircle2, FileText, AlertTriangle, Send as SendIcon, Calendar } from "lucide-react";
import { format, differenceInCalendarDays, startOfWeek, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { AppShell } from "@/components/AppShell";
import { DeadlineBucketBadge, StatusBadge } from "@/components/StatusBadge";
import { MOCK_REQUESTS, getDeadlineBucket } from "@/lib/mock-data";

export default function Dashboard() {
  const total = MOCK_REQUESTS.length;
  const nuevas = MOCK_REQUESTS.filter((r) => r.status === "nueva").length;
  const listas = MOCK_REQUESTS.filter((r) => r.status === "lista").length;
  const entregadas = MOCK_REQUESTS.filter((r) => r.status === "entregada").length;

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  // Solicitudes vencidas (no entregadas, con deadline en el pasado)
  const overdueRequests = MOCK_REQUESTS.filter(
    (r) => r.status !== "entregada" && r.deadline && new Date(r.deadline).getTime() < today.getTime()
  );

  // Notificar a todos los actores (KAM, Líder, Profesor) de cada solicitud vencida.
  // Una sola vez por carga del dashboard.
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (notifiedRef.current) return;
    if (overdueRequests.length === 0) return;
    notifiedRef.current = true;
    overdueRequests.forEach((r) => {
      const actores = [r.kam, r.productLeader, r.professor].filter(Boolean).join(", ");
      toast({
        title: `Solicitud vencida: ${r.id}`,
        description: `${r.company} — ${r.title}. Notificado a: ${actores}.`,
        variant: "destructive",
      });
    });
  }, [overdueRequests]);

  const urgentes = MOCK_REQUESTS.filter(
    (r) => r.status !== "entregada" && getDeadlineBucket(r.deadline) === "urgente"
  ).length;

  const proximas = MOCK_REQUESTS.filter(
    (r) => r.status !== "entregada" && getDeadlineBucket(r.deadline) === "proximo"
  ).length;

  const borradoresPendientes = MOCK_REQUESTS.filter((r) => r.status === "borrador").length;

  const enviadasSemana = MOCK_REQUESTS.filter(
    (r) => r.status === "entregada" && r.sentAt && isAfter(new Date(r.sentAt), weekStart)
  ).length;

  const stats = [
    { label: "Total solicitudes", value: total, icon: FileText },
    { label: "Nuevas", value: nuevas, icon: TrendingUp },
    { label: "Pendiente de envío", value: listas, icon: Clock },
    { label: "Enviada al cliente", value: entregadas, icon: CheckCircle2 },
  ];

  const exec = [
    { label: "Urgentes", value: urgentes, icon: AlertTriangle, tone: "text-destructive bg-destructive/10" },
    { label: "Próximas a vencer", value: proximas, icon: Clock, tone: "text-warning bg-warning/10" },
    { label: "Borradores pendientes", value: borradoresPendientes, icon: FileText, tone: "text-muted-foreground bg-muted" },
    { label: "Enviadas esta semana", value: enviadasSemana, icon: SendIcon, tone: "text-success bg-success/10" },
  ];

  // Prioritized list: open requests sorted by deadline bucket (urgente → próximo → sin fecha) then by deadline proximity
  const bucketRank: Record<string, number> = { urgente: 0, proximo: 1, sinfecha: 3 };
  const prioritized = MOCK_REQUESTS.filter((r) => r.status !== "entregada")
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
    <AppShell>
      <div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Inicio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona solicitudes de capacitación, consultoría y mentoría.
          </p>
        </div>

        {/* Resumen ejecutivo */}
        <div className="mt-6">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Resumen ejecutivo
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {exec.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md ${s.tone}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{s.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary actions */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            to="/solicitudes/nueva"
            className="flex items-start gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-accent/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
              <PlusCircle className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-foreground">Ingresar solicitud</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registra una nueva solicitud comercial paso a paso.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Comenzar <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>

          <Link
            to="/solicitudes"
            className="flex items-start gap-4 rounded-md border border-border bg-card p-5 transition-colors hover:border-accent/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
              <ListChecks className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-foreground">Ver solicitudes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tablero con todas las solicitudes por estado.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Ver tablero <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        </div>

        {/* Prioritized timeline */}
        <div className="mt-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Solicitudes prioritarias
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Ordenadas por prioridad y proximidad de fecha límite.</p>
            </div>
            <Link to="/solicitudes" className="text-xs font-medium text-accent hover:underline">Ver todas</Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
            {prioritized.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No hay solicitudes activas.</div>
            ) : (
              <ul className="divide-y divide-border">
                {prioritized.map((r) => {
                  const days = r.deadline ? differenceInCalendarDays(new Date(r.deadline), today) : null;
                  const overdue = days !== null && days < 0;
                  const dueSoon = days !== null && days >= 0 && days <= 2;
                  const showStatusBadge = r.status === "lista" || r.status === "borrador";
                  return (
                    <li key={r.id}>
                      <Link
                        to={`/solicitudes/${r.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-secondary/40 px-2 py-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className={`mt-0.5 text-[11px] font-semibold ${overdue ? "text-destructive" : dueSoon ? "text-warning" : "text-foreground"}`}>
                            {r.deadline ? format(new Date(r.deadline), "d MMM", { locale: es }) : "Sin fecha"}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-foreground">{r.company}</span>
                            <DeadlineBucketBadge bucket={getDeadlineBucket(r.deadline)} />
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.title}</p>
                        </div>
                        {overdue ? (
                          <span className="hidden sm:inline-flex items-center gap-1.5 rounded border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            Vencida
                          </span>
                        ) : showStatusBadge ? (
                          <StatusBadge status={r.status} className="hidden sm:inline-flex" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resumen</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{s.value}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
