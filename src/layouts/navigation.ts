import {
  ArrowLeftRight,
  BarChart3,
  HandCoins,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Repeat,
  Sparkles,
  Tags,
  type LucideIcon,
} from "lucide-react";

/**
 * Analítica es una app aparte. Va con prefijo NEXT_PUBLIC_ porque este menú corre en
 * el navegador (una variable sin ese prefijo llegaría como `undefined` al bundle) y
 * se inyecta en tiempo de build. Sin configurar, apunta al puerto local por defecto.
 */
const ANALITICA_URL =
  process.env.NEXT_PUBLIC_URL_ANALITICA?.trim() || "http://localhost:3002";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Texto corto bajo la etiqueta en el menú móvil. */
  hint?: string;
  /** Resalta el acceso (Savvi IA). */
  highlight?: boolean;
  /** Enlace a otra aplicación: no se marca como activo por la ruta actual. */
  external?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** Menú agrupado por lo que el usuario quiere hacer. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Inicio",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Tu resumen del mes" },
      { href: "/savvi-ia", label: "Savvi IA", icon: Sparkles, hint: "Pregunta o registra hablando", highlight: true },
    ],
  },
  {
    title: "Movimientos",
    items: [
      { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight, hint: "Ingresos y gastos" },
      { href: "/pagos-recurrentes", label: "Pagos recurrentes", icon: Repeat, hint: "Lo que pagas cada mes" },
    ],
  },
  {
    title: "Planeación",
    items: [
      { href: "/budget", label: "Presupuesto", icon: PiggyBank, hint: "Límites por categoría" },
      { href: "/planificador", label: "Mis deudas", icon: HandCoins, hint: "Planifica tus pagos" },
    ],
  },
  {
    title: "Configuración",
    items: [
      { href: "/accounts", label: "Cuentas", icon: Landmark, hint: "Bancos y tarjetas" },
      { href: "/categories", label: "Categorías", icon: Tags, hint: "Grupos y subcategorías" },
    ],
  },
  {
    title: "Más",
    items: [
      { href: ANALITICA_URL, label: "Analítica", icon: BarChart3, hint: "Reportes avanzados", external: true },
    ],
  },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.external) return false;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function initialsFromName(name: string | undefined): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
