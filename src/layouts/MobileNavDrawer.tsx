"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import {
  SIDEBAR_BG,
  SidebarBrand,
  SidebarProfile,
  SidebarSections,
} from "./SidebarContent";

/**
 * Menú hamburguesa para celular: abre el mismo menú lateral como un panel
 * deslizante desde la izquierda. Se cierra al navegar, con Esc o tocando fuera.
 */
export default function MobileNavDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Si la ruta cambia (p. ej. con el botón atrás), el panel se cierra.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 transition-all hover:bg-slate-100 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50 md:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#0B1829]/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 md:hidden" />
        <Dialog.Content
          style={{ backgroundColor: SIDEBAR_BG }}
          className="fixed inset-y-0 left-0 z-[95] flex w-[86%] max-w-[320px] flex-col shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=closed]:duration-200 md:hidden"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Menú</Dialog.Title>

          <div className="flex h-[72px] shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 pt-[env(safe-area-inset-top)]">
            <SidebarBrand />
            <Dialog.Close
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:rotate-90 hover:bg-white/10 hover:text-white active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/60"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 scrollbar-clean">
            <SidebarSections variant="mobile" onNavigate={() => setOpen(false)} />
          </div>

          <div className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <SidebarProfile onNavigate={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
