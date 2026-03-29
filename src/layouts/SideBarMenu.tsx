"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import {
  ArrowRightOnRectangleIcon,
  BanknotesIcon,
  ChartPieIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  TagIcon,
  ArrowsRightLeftIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/features/auth/hooks/useAuth";

/** Fondo sidebar (referencia diseño oscuro) */
const SIDEBAR_BG = "#0A1622";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: HomeIcon,
  },
  {
    href: "/categories",
    label: "Categorías",
    icon: TagIcon,
  },
  {
    href: "/accounts",
    label: "Cuentas",
    icon: BuildingLibraryIcon,
  },
  {
    href: "/planificador",
    label: "Mis Deudas",
    icon: ClipboardDocumentListIcon,
  },
  {
    href: "/transferencias",
    label: "Pagos Recurrentes",
    icon: BanknotesIcon,
  },
  {
    href: "/budget",
    label: "Presupuesto",
    icon: ChartPieIcon,
  },
  {
    href: "/transactions",
    label: "Transacciones",
    icon: ArrowsRightLeftIcon,
  },
] as const;

function initialsFromName(name: string | undefined): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SideBarMenu() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const initials = initialsFromName(user?.name);

  return (
    <aside
      style={{ backgroundColor: SIDEBAR_BG }}
      className="font-body hidden min-h-screen w-[248px] shrink-0 flex-col self-stretch border-r border-white/10 md:flex"
      aria-label="Menú principal"
    >
      {/* Logo — alineado en altura con header (72px) */}
      <div className="flex h-[72px] shrink-0 items-center border-b border-white/10 px-4">
        <Link
          href="/"
          className="group flex min-h-0 w-full items-center gap-3 rounded-xl px-1 py-0 transition-colors hover:bg-white/5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint shadow-inner">
            <Star
              className="h-5 w-5 text-cosmos"
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Savvi
          </span>
        </Link>
      </div>

      {/* Perfil */}
      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <div className="flex gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-xs font-bold text-[#0A1622] shadow-md ring-2 ring-white/10"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name ?? "Usuario"}
            </p>
            {user?.email ? (
              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                {user.email}
              </p>
            ) : null}
            <p
              className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-mint"
              role="status"
              aria-label="Estado: en línea"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                aria-hidden
              />
              <span>En línea</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3 scrollbar-clean">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? "bg-mint/15 text-mint shadow-sm ring-1 ring-mint/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive ? "text-mint" : "text-slate-500 group-hover:text-slate-300"
                }`}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
        >
          <ArrowRightOnRectangleIcon
            className="h-5 w-5 shrink-0 text-rose-400/90"
            aria-hidden
          />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
