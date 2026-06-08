import { Link } from "react-router-dom";
import { Calendar, Building2 } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { DeadlineBucketBadge } from "./StatusBadge";
import { getDeadlineBucket } from "@/lib/mock-data";
import type { LdpProposal } from "@/lib/ldp-data";

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

export function LdpProposalCard({ p }: { p: LdpProposal }) {
  return (
    <Link
      to={`/ldp/propuestas/${p.id}`}
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
          <p className="font-medium text-foreground">{formatCopCard(p.totalCost)}</p>
        )}
      </div>
    </Link>
  );
}
