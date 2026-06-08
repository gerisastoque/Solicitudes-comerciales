import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Building2,
} from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeadlineBucketBadge } from "@/components/StatusBadge";
import {
  PROF_STATUS_META,
  PROF_COLUMNS,
  CURRENT_PROFESSOR,
  getProfStatus,
  getProfessorProposals,
  type ProfStatus,
} from "@/lib/profesor-data";
import { getDeadlineBucket, type LdpProposal } from "@/lib/ldp-data";
import { cn } from "@/lib/utils";

const COLUMN_LIMIT = 8;

function daysLabel(deadline?: string): string {
  if (!deadline) return "Sin fecha";
  const diff = differenceInCalendarDays(new Date(deadline), new Date());
  if (diff < 0) return "Vencida";
  if (diff === 0) return "Vence hoy";
  return `Quedan ${diff} día${diff === 1 ? "" : "s"}`;
}

function formatCopCard(n: number) {
  return `$${n.toLocaleString("es-CO")} COP`;
}

function ProfCard({ p }: { p: LdpProposal }) {
  return (
    <Link
      to={`/profesor/propuestas/${p.id}`}
      className="block rounded-md border border-border bg-card p-3 transition-colors hover:border-accent/50"
    >
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {p.companyLogo ? (
          <img
            src={p.companyLogo}
            alt={p.company}
            className="h-6 w-6 shrink-0 rounded-sm border border-border bg-card object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border bg-secondary text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
          </div>
        )}
        <span className="truncate text-sm font-semibold text-foreground">
          {p.company}
        </span>
      </div>

      <div className="mt-2">
        <p className="text-[11px] font-mono text-muted-foreground">{p.id}</p>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {p.title}
        </h3>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <DeadlineBucketBadge bucket={getDeadlineBucket(p.deadline)} />
        <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {p.type}
        </span>
      </div>

      <div className="mt-3 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          <span>
            Creada {format(new Date(p.createdAt), "d MMM yyyy", { locale: es })}
          </span>
          <span className="ml-auto font-medium text-foreground">
            {daysLabel(p.deadline)}
          </span>
        </div>
        {p.totalCost != null && (
          <p className="font-medium text-foreground">
            {formatCopCard(p.totalCost)}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function ProfesorBoard() {
  const [params, setParams] = useSearchParams();
  const columnView = params.get("columna") as ProfStatus | null;
  const isColumnView =
    !!columnView && (PROF_COLUMNS as string[]).includes(columnView);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [urgency, setUrgency] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 320);
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const all = getProfessorProposals();

  const filtered = useMemo(() => {
    return all.filter((p) => {
      const ps = getProfStatus(p);
      if (!ps) return false;
      if (
        q &&
        !`${p.title} ${p.applicant} ${p.id} ${p.company}`
          .toLowerCase()
          .includes(q.toLowerCase())
      )
        return false;
      if (status !== "all" && ps !== status) return false;
      if (urgency !== "all" && getDeadlineBucket(p.deadline) !== urgency)
        return false;
      if (type !== "all" && p.type !== type) return false;
      return true;
    });
  }, [all, q, status, urgency, type]);

  const grouped = useMemo(() => {
    const g: Record<ProfStatus, LdpProposal[]> = {
      nueva: [],
      elaboracion: [],
      enviada: [],
      ajuste: [],
      rechazada: [],
    };
    filtered
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .forEach((p) => {
        const ps = getProfStatus(p)!;
        g[ps].push(p);
      });
    return g;
  }, [filtered]);

  const columnItems = isColumnView ? grouped[columnView as ProfStatus] : [];

  return (
    <AppShell role="Profesor">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {isColumnView && (
              <button
                type="button"
                onClick={() => {
                  params.delete("columna");
                  setParams(params, { replace: true });
                }}
                className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Volver al tablero
              </button>
            )}
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Profesor · {CURRENT_PROFESSOR.name}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
              {isColumnView
                ? PROF_STATUS_META[columnView as ProfStatus].label
                : "Propuestas"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isColumnView
                ? `${columnItems.length} propuestas en esta columna`
                : `${filtered.length} propuestas asignadas`}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 rounded-md border border-border bg-card p-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, solicitante o empresa..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
            {!isColumnView && (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="lg:w-[170px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {PROF_COLUMNS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {PROF_STATUS_META[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger className="lg:w-[200px]">
                <SelectValue placeholder="Urgencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda urgencia</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="proximo">Próximo a vencer</SelectItem>
                <SelectItem value="sinfecha">Sin fecha definida</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="lg:w-[170px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Capacitación">Capacitación</SelectItem>
                <SelectItem value="Consultoría">Consultoría</SelectItem>
                <SelectItem value="Mentoría">Mentoría</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isColumnView && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {columnItems.map((p) => (
              <ProfCard key={p.id} p={p} />
            ))}
            {columnItems.length === 0 && (
              <div className="col-span-full rounded-md border border-dashed border-border p-10 text-center">
                <SlidersHorizontal className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Sin resultados</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ajusta los filtros o la búsqueda.
                </p>
              </div>
            )}
          </div>
        )}

        {!isColumnView && (
          <div className="relative mt-5">
            <button
              type="button"
              onClick={() => scrollBy("left")}
              className="absolute -left-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-secondary md:flex"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy("right")}
              className="absolute -right-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-secondary md:flex"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div
              ref={scrollerRef}
              className="flex gap-3 overflow-x-auto scroll-smooth pb-2"
            >
              {PROF_COLUMNS.map((col) => {
                const meta = PROF_STATUS_META[col];
                const items = grouped[col];
                const visible = items.slice(0, COLUMN_LIMIT);
                const overflow = items.length - visible.length;
                return (
                  <div
                    key={col}
                    className="flex w-[280px] shrink-0 flex-col rounded-md border border-border bg-secondary/50 p-2 sm:w-[300px]"
                  >
                    <div className="mb-2 flex items-center justify-between px-1.5 py-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", meta.dot)}
                        />
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                          {meta.label}
                        </h3>
                      </div>
                      <span className="rounded bg-card px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      {items.length === 0 ? (
                        <div className="rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                          Sin propuestas
                        </div>
                      ) : (
                        visible.map((p) => <ProfCard key={p.id} p={p} />)
                      )}
                      {overflow > 0 && (
                        <Link
                          to={`/profesor/propuestas?columna=${col}`}
                          className="mt-1 rounded-md border border-border bg-card px-3 py-2 text-center text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                        >
                          Ver más ({overflow})
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
