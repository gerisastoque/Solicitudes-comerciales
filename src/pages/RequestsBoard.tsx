import { useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, PlusCircle, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { MOCK_REQUESTS, STATUS_META, getDeadlineBucket, type RequestStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const COLUMNS: RequestStatus[] = ["nueva", "lista", "borrador", "entregada", "ajustes", "rechazada"];
const COLUMN_LIMIT = 8;

export default function RequestsBoard() {
  const [params, setParams] = useSearchParams();
  const columnView = params.get("columna") as RequestStatus | null;
  const isColumnView = !!columnView && (COLUMNS as string[]).includes(columnView);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [urgency, setUrgency] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 320);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const filtered = useMemo(() => {
    return MOCK_REQUESTS.filter((r) => {
      if (q && !`${r.title} ${r.applicant} ${r.id} ${r.company}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (status !== "all" && r.status !== status) return false;
      if (urgency !== "all" && getDeadlineBucket(r.deadline) !== urgency) return false;
      if (type !== "all" && r.type !== type) return false;
      return true;
    });
  }, [q, status, urgency, type]);

  const grouped = useMemo(() => {
    const g: Record<RequestStatus, typeof MOCK_REQUESTS> = { nueva: [], lista: [], borrador: [], entregada: [], ajustes: [], rechazada: [] };
    filtered
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach((r) => g[r.status].push(r));
    return g;
  }, [filtered]);

  const columnItems = isColumnView
    ? grouped[columnView as RequestStatus]
    : [];

  return (
    <AppShell>
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {isColumnView && (
              <button
                type="button"
                onClick={() => { params.delete("columna"); setParams(params, { replace: true }); }}
                className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Volver al tablero
              </button>
            )}
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {isColumnView ? STATUS_META[columnView as RequestStatus].label : "Solicitudes"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isColumnView ? `${columnItems.length} solicitudes en esta columna` : `${filtered.length} solicitudes encontradas`}
            </p>
          </div>
          <Button asChild>
            <Link to="/solicitudes/nueva"><PlusCircle className="h-4 w-4" /> Nueva solicitud</Link>
          </Button>
        </div>

        {/* Filters */}
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
                <SelectTrigger className="lg:w-[170px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {COLUMNS.map((c) => <SelectItem key={c} value={c}>{STATUS_META[c].label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger className="lg:w-[200px]"><SelectValue placeholder="Urgencia" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda urgencia</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="proximo">Próximo a vencer</SelectItem>
                <SelectItem value="sinfecha">Sin fecha definida</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="lg:w-[170px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Capacitación">Capacitación</SelectItem>
                <SelectItem value="Consultoría">Consultoría</SelectItem>
                <SelectItem value="Mentoría">Mentoría</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Single-column grid view (Ver más) */}
        {isColumnView && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {columnItems.map((r) => <RequestCard key={r.id} req={r} />)}
            {columnItems.length === 0 && (
              <div className="col-span-full rounded-md border border-dashed border-border p-10 text-center">
                <SlidersHorizontal className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Sin resultados</p>
                <p className="mt-1 text-xs text-muted-foreground">Ajusta los filtros o la búsqueda.</p>
              </div>
            )}
          </div>
        )}

        {/* Kanban board */}
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
            <div ref={scrollerRef} className="flex gap-3 overflow-x-auto scroll-smooth pb-2">
              {COLUMNS.map((col) => {
                const meta = STATUS_META[col];
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
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">{meta.label}</h3>
                      </div>
                      <span className="rounded bg-card px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      {items.length === 0 ? (
                        <div className="rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                          Sin solicitudes
                        </div>
                      ) : (
                        visible.map((r) => <RequestCard key={r.id} req={r} />)
                      )}
                      {overflow > 0 && (
                        <Link
                          to={`/solicitudes?columna=${col}`}
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
