"use client";

import { useSyncExternalStore } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SIDEBAR_BG,
  SidebarBrand,
  SidebarProfile,
  SidebarSections,
} from "./SidebarContent";

/** Preferencia por navegador: el menú compacto es una comodidad, no un dato. */
const STORAGE_KEY = "savvi_sidebar_collapsed";
const CHANGE_EVENT = "savvi-sidebar-change";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setCollapsed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* modo privado: la preferencia no se recuerda */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Menú lateral de escritorio. Se puede compactar a solo íconos. */
export default function SideBarMenu() {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      style={{ backgroundColor: SIDEBAR_BG }}
      className={cn(
        "font-body sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/10 transition-[width] duration-300 ease-out motion-reduce:transition-none md:flex",
        collapsed ? "w-[76px]" : "w-[248px]",
      )}
      aria-label="Menú lateral"
    >
      {/* Marca — alineada en altura con el header (72px) */}
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center border-b border-white/10",
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-4",
        )}
      >
        <SidebarBrand collapsed={collapsed} />
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/60"
            aria-label="Compactar menú"
            title="Compactar menú"
          >
            <ToggleIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 py-4",
          // En modo compacto las etiquetas flotan fuera del menú: no se recorta.
          collapsed ? "overflow-visible px-2" : "overflow-y-auto px-3 scrollbar-clean",
        )}
      >
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mx-auto mb-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/60"
            aria-label="Expandir menú"
            title="Expandir menú"
          >
            <ToggleIcon className="h-4 w-4" />
          </button>
        )}
        <SidebarSections collapsed={collapsed} variant="desktop" />
      </div>

      <div className="shrink-0 border-t border-white/10 p-3">
        <SidebarProfile collapsed={collapsed} />
      </div>
    </aside>
  );
}
