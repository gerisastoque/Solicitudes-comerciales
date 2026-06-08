import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer, FileText, FileType } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOCK_LDP_PROPOSALS, LDP_STATUS_META } from "@/lib/ldp-data";

const UPLOADED_DOCS = [
  { name: "Brief_Cliente.pdf", size: "1.2 MB", date: "12/03/2026", type: "pdf" as const },
  { name: "Requerimientos_Iniciales.docx", size: "640 KB", date: "12/03/2026", type: "doc" as const },
  { name: "Plan_Capacitacion.pdf", size: "2.1 MB", date: "13/03/2026", type: "pdf" as const },
];

const SECTIONS = [
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
      ["Necesidad o problema", "—"],
      ["Horas de dedicación", "Más de 60"],
      ["Modalidad", "Híbrida"],
      ["Servicio de alimentación", "Sí"],
      ["Resultados esperados", "—"],
      ["Cómo se medirá el éxito", "—"],
      ["Competencias a fortalecer", "—"],
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

export default function LdpSummary() {
  const { id } = useParams();
  const p = MOCK_LDP_PROPOSALS.find((x) => x.id === id) ?? MOCK_LDP_PROPOSALS[0];
  const meta = LDP_STATUS_META[p.status];

  return (
    <AppShell role="Líder de Producto">
      <div>
        <Link
          to={`/ldp/propuestas/${p.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al detalle
        </Link>

        <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-card p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{p.id}</p>
            <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight">{p.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
                  meta.tone
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                {meta.label}
              </span>
              <span className="rounded border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {p.type}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline"><Printer className="h-4 w-4" /> Imprimir</Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Centro asignado", p.nodes && p.nodes.length > 0 ? p.nodes.join(", ") : "Sin asignar"],
            ["Líder de Producto", p.productLeader],
            ["KAM responsable", p.kam],
            ["Profesor", p.professor ?? "Sin asignar"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {SECTIONS.map((s) => (
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
      </div>
    </AppShell>
  );
}
