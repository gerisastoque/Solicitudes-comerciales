import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, FileText, PlusCircle, LogOut, PanelLeftClose, PanelLeft, Menu, Layers, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import icesiLogo from "@/assets/icesi-logo.png";

const NAV_KAM = [
  { to: "/dashboard", label: "Inicio", icon: LayoutGrid },
  { to: "/solicitudes", label: "Solicitudes", icon: FileText },
  { to: "/solicitudes/nueva", label: "Nueva solicitud", icon: PlusCircle },
];

const NAV_LDP = [
  { to: "/ldp", label: "Inicio", icon: LayoutGrid },
  { to: "/ldp/propuestas", label: "Propuestas", icon: Layers },
];

const NAV_NODO = [
  { to: "/nodo", label: "Inicio", icon: LayoutGrid },
  { to: "/nodo/propuestas", label: "Propuestas", icon: Layers },
];

const NAV_PROFESOR = [
  { to: "/profesor", label: "Inicio", icon: LayoutGrid },
  { to: "/profesor/propuestas", label: "Propuestas", icon: Layers },
];


interface AppShellProps {
  children: React.ReactNode;
  role?: string;
}

export function AppShell({ children, role = "KAM" }: AppShellProps) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(true);
  const NAV =
    role === "Líder de Producto"
      ? NAV_LDP
      : role === "Líder de Centro"
      ? NAV_NODO
      : role === "Profesor"
      ? NAV_PROFESOR
      : NAV_KAM;


  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-card transition-[width] duration-200 lg:flex lg:flex-col",
          open ? "w-60" : "w-16"
        )}
      >
        <div className={cn("flex border-b border-border", open ? "flex-col px-5 py-3 gap-2" : "h-14 px-2 items-center justify-center")}>
          {open ? (
            <>
              <div className="flex items-start justify-between">
                <Link to="/dashboard" aria-label="Ir al inicio" className="flex items-center">
                  <img src={icesiLogo} alt="Universidad Icesi" className="h-7 w-auto object-contain" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Colapsar menú"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
              <p className="font-display text-xs font-semibold text-muted-foreground">Solicitudes Comerciales</p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Expandir menú"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className={cn("flex-1 space-y-0.5", open ? "p-3" : "p-2")}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.to ||
              (item.to !== "/dashboard" &&
                item.to !== "/ldp" &&
                item.to !== "/nodo" &&
                item.to !== "/profesor" &&
                pathname.startsWith(item.to));

            return (
              <Link
                key={item.to}
                to={item.to}
                title={!open ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-md text-sm transition-colors",
                  open ? "gap-2.5 px-3 py-2" : "h-9 w-full justify-center",
                  active
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {open && item.label}
              </Link>
            );
          })}
        </nav>

        <div className={cn("border-t border-border", open ? "p-3" : "p-2")}>
          {open && (
            <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                {role.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">Usuario {role}</p>
                <p className="truncate text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
          )}
          <Link
            to="/"
            title={!open ? "Cerrar sesión" : undefined}
            className={cn(
              "flex items-center rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
              open ? "gap-2 px-3 py-2" : "h-9 w-full justify-center"
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
            {open && "Cerrar sesión"}
          </Link>
        </div>
      </aside>

      {/* Mobile top */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Menu className="h-4 w-4 text-muted-foreground" />
          <Link to="/dashboard" aria-label="Ir al inicio" className="flex items-center">
            <img src={icesiLogo} alt="Universidad Icesi" className="h-6 w-auto object-contain" />
          </Link>
        </div>
        <Link to="/" className="text-xs text-muted-foreground">Salir</Link>
      </header>

      <main className={cn("transition-[padding] duration-200", open ? "lg:pl-60" : "lg:pl-16")}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
