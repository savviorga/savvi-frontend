"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function SideBarMenu() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside
      className="hidden w-60 shrink-0 flex-col border-r border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 shadow-sm md:flex"
      aria-label="Menú principal"
    >
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3 pt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-900 shadow-sm ring-1 ring-emerald-500/20"
                  : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive
                    ? "text-emerald-600"
                    : "text-slate-400 group-hover:text-emerald-600"
                }`}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/80 bg-white/60 p-3">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
        >
          <ArrowRightOnRectangleIcon
            className="h-5 w-5 shrink-0 text-rose-500"
            aria-hidden
          />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
