"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, LogOut, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  NAV_SECTIONS,
  initialsFromName,
  isNavItemActive,
  type NavItem,
} from "./navigation";

/** Fondo del menú (diseño oscuro de marca). */
export const SIDEBAR_BG = "#0A1622";

type Variant = "desktop" | "mobile";

/** Etiqueta flotante del modo compacto: aparece al pasar el mouse o con el foco. */
function RailTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0B1829] opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  variant,
  index,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  variant: Variant;
  index: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const mobile = variant === "mobile";

  const className = cn(
    "group relative flex items-center gap-3 rounded-xl text-sm font-medium outline-none transition-all duration-200",
    "focus-visible:ring-2 focus-visible:ring-mint/60",
    collapsed ? "mx-auto h-11 w-11 justify-center" : mobile ? "px-3 py-2.5" : "px-2.5 py-2",
    active
      ? "bg-gradient-to-r from-mint/20 via-mint/10 to-transparent text-white"
      : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
    mobile &&
      "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-4 motion-safe:fill-mode-both motion-safe:duration-300",
  );

  const content = (
    <>
      {/* Indicador del activo */}
      {active && !collapsed && (
        <span
          className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-mint shadow-[0_0_12px_rgba(0,212,170,0.7)] motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-300"
          aria-hidden
        />
      )}
      <span
        className={cn(
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
          active
            ? "bg-mint text-cosmos shadow-md shadow-mint/30"
            : item.highlight
              ? "bg-gradient-to-br from-mint/25 to-cyan-400/15 text-mint group-hover:from-mint/35"
              : "bg-white/[0.05] text-slate-400 group-hover:bg-white/10 group-hover:text-white",
        )}
      >
        <Icon
          className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
          aria-hidden
        />
        {item.highlight && !active && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full rounded-full bg-mint opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint ring-2 ring-[#0A1622]" />
          </span>
        )}
      </span>

      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate">{item.label}</span>
            {item.highlight && (
              <span className="rounded-md bg-mint/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-mint">
                IA
              </span>
            )}
          </span>
          {mobile && item.hint && (
            <span className="block truncate text-[11px] font-normal text-slate-500 group-hover:text-slate-400">
              {item.hint}
            </span>
          )}
        </span>
      )}

      {!collapsed && item.external && (
        <ArrowUpRight
          className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-mint"
          aria-hidden
        />
      )}

      {collapsed && <RailTooltip label={item.label} />}
    </>
  );

  const style = mobile ? { animationDelay: `${60 + index * 35}ms` } : undefined;

  // Otra aplicación: navegación del navegador, no del router de Next.
  if (item.external) {
    return (
      <a href={item.href} className={className} style={style} aria-label={collapsed ? item.label : undefined}>
        {content}
      </a>
    );
  }
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={className}
      style={style}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
    >
      {content}
    </Link>
  );
}

export function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="group flex min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-mint/60"
      aria-label="Savvi, ir al inicio"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint shadow-lg shadow-mint/25 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105">
        <Star className="h-5 w-5 text-cosmos" fill="currentColor" strokeWidth={0} aria-hidden />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block text-lg font-bold leading-tight tracking-tight text-white">Savvi</span>
          <span className="block text-[11px] leading-tight text-slate-500">Tus finanzas, claras</span>
        </span>
      )}
    </Link>
  );
}

/** Secciones del menú, clasificadas por lo que el usuario quiere hacer. */
export function SidebarSections({
  collapsed = false,
  variant,
  onNavigate,
}: {
  collapsed?: boolean;
  variant: Variant;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  let index = 0;

  return (
    <nav aria-label="Menú principal" className="space-y-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          {collapsed ? (
            <div className="mx-auto mb-2 h-px w-6 bg-white/10" aria-hidden />
          ) : (
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {section.title}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  active={isNavItemActive(item, pathname)}
                  collapsed={collapsed}
                  variant={variant}
                  index={index++}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Tarjeta del usuario con acceso al perfil y a cerrar sesión. */
export function SidebarProfile({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const initials = initialsFromName(user?.name);
  const active = pathname === "/perfil";

  const avatar = (
    <span className="relative shrink-0">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-mint via-teal-400 to-cyan-400 text-xs font-bold text-[#0A1622] shadow-md">
        {initials}
      </span>
      <span
        className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#0A1622]"
        aria-label="En línea"
        role="status"
      />
    </span>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/perfil"
          onClick={onNavigate}
          className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-mint/60"
          aria-label="Mi perfil"
        >
          {avatar}
          <RailTooltip label={user?.name ?? "Mi perfil"} />
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <RailTooltip label="Cerrar sesión" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl p-2 ring-1 transition-colors",
        active ? "bg-mint/10 ring-mint/30" : "bg-white/[0.04] ring-white/10 hover:bg-white/[0.07]",
      )}
    >
      <Link
        href="/perfil"
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-mint/60"
      >
        {avatar}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">{user?.name ?? "Usuario"}</span>
          <span className="block truncate text-[11px] text-slate-400">
            {user?.email ?? "Ver mi perfil"}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => logout()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-rose-500/15 hover:text-rose-400 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}
