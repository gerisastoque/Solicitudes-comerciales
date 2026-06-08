import { Link, useParams } from "react-router-dom";
import { ArrowLeft, GraduationCap, Calendar, Mail } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { AppShell } from "@/components/AppShell";
import { DeadlineBucketBadge } from "@/components/StatusBadge";
import {
  CURRENT_NODE,
  getProfessorBySlug,
  getProposalsForProfessor,
} from "@/lib/nodo-data";
import { LDP_STATUS_META, getDeadlineBucket } from "@/lib/ldp-data";
import { cn } from "@/lib/utils";

export default function NodoProfessorDetail() {
  const { slug = "" } = useParams();
  const prof = getProfessorBySlug(slug);
  const today = new Date();

  if (!prof) {
    return (
      <AppShell role="Líder de Centro">
        <Link to="/nodo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="mt-6 rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Profesor no encontrado en el centro.
        </div>
      </AppShell>
    );
  }

  const items = getProposalsForProfessor(prof.name).slice().sort((a, b) => {
    const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
    const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });

  const counts = {
    proceso: items.filter((x) => x.status === "proceso").length,
    entregada: items.filter((x) => x.status === "entregada").length,
    ajustes: items.filter((x) => x.status === "ajustes").length,
    rechazada: items.filter((x) => x.status === "rechazada").length,
  };

  return (
    <AppShell role="Líder de Centro">
      <div>
        <Link
          to="/nodo"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="mt-3 flex flex-col gap-4 rounded-md border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Centro · {CURRENT_NODE.name}
              </p>
              <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight text-foreground">{prof.name}</h1>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" /> {prof.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground">Propuestas asignadas</p>
            <p className="font-display text-3xl font-bold tracking-tight text-foreground">{items.length}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <Pill label="En proceso" value={counts.proceso} tone="border-info/20 bg-info/10 text-info" />
          <Pill label="Entregadas" value={counts.entregada} tone="border-success/20 bg-success/10 text-success" />
          <Pill label="En ajustes" value={counts.ajustes} tone="border-warning/20 bg-warning/10 text-warning" />
          <Pill label="Rechazadas" value={counts.rechazada} tone="border-destructive/20 bg-destructive/10 text-destructive" />
        </div>

        <div className="mt-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Propuestas asignadas
          </h2>
          <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Este profesor aún no tiene propuestas asignadas.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((p) => {
                  const days = p.deadline ? differenceInCalendarDays(new Date(p.deadline), today) : null;
                  const overdue = days !== null && days < 0;
                  const dueSoon = days !== null && days >= 0 && days <= 2;
                  const meta = LDP_STATUS_META[p.status];
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/nodo/propuestas/${p.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50"
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
                            <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {p.type}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {p.id} · {p.title}
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
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Pill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={cn("flex items-center justify-between rounded-md border bg-card px-3 py-2", tone)}>
      <span className="text-xs font-medium">{label}</span>
      <span className="font-display text-sm font-bold">{value}</span>
    </div>
  );
}
