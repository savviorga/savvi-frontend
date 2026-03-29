"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpFromLine, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalContentContainerContext } from "./ModalContentContainerContext";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  hideCloseButton?: boolean;
  /** Icono junto al título; por defecto un icono de “subir/registrar”. Usa `null` para ocultarlo. */
  headerIcon?: React.ReactNode | null;
  /**
   * En viewports &lt; md el panel ocupa el 100% del viewport (móvil).
   * En md+ se mantiene el modal centrado con `max-w` habitual.
   * @default true
   */
  fullScreenOnSmallViewports?: boolean;
}

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  hideCloseButton = false,
  headerIcon,
  fullScreenOnSmallViewports = true,
}: ModalProps) {
  const showHeader = Boolean(title || !hideCloseButton);
  const [contentEl, setContentEl] = useState<HTMLElement | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "fade-in fade-out duration-200 ease-out",
          )}
        />

        <Dialog.Content
          ref={(node) => {
            setContentEl(node);
          }}
          className={cn(
            "fixed z-[110] flex flex-col overflow-hidden bg-white p-0 shadow-xl focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "fade-in fade-out duration-200 ease-out",
            fullScreenOnSmallViewports
              ? [
                  "max-md:inset-0 max-md:left-0 max-md:top-0 max-md:h-full max-md:max-h-none max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none",
                  "md:left-1/2 md:top-1/2 md:h-auto md:max-h-[min(90vh,52rem)] md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl",
                ]
              : "left-1/2 top-1/2 w-full max-h-[min(90vh,52rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl",
            className,
          )}
        >
          <ModalContentContainerContext.Provider value={contentEl}>
          {showHeader && (
            <header
              className={cn(
                "relative shrink-0 overflow-hidden rounded-t-2xl border-b border-white/[0.08] bg-[#0a1118] px-6 py-5 shadow-[0_1px_0_rgba(0,0,0,0.35)]",
                fullScreenOnSmallViewports && "max-md:rounded-t-none",
              )}
            >
              <div
                className="pointer-events-none absolute -right-16 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-8 top-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl"
                aria-hidden
              />

              <div className="relative z-10 flex items-center gap-4">
                {title ? (
                  <>
                    {headerIcon !== null && (
                      <div
                        className="flex shrink-0 rounded-lg border border-[#00C49A]/35 bg-[#0d2820]/80 p-2.5 shadow-inner"
                        aria-hidden
                      >
                        {headerIcon ?? (
                          <ArrowUpFromLine
                            className="h-5 w-5 text-[#00C49A]"
                            strokeWidth={2}
                          />
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Dialog.Title className="text-lg font-bold tracking-tight text-white">
                        {title}
                      </Dialog.Title>
                      {description ? (
                        <Dialog.Description className="mt-1 text-sm leading-snug text-[#94a3b8]">
                          {description}
                        </Dialog.Description>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="min-w-0 flex-1" />
                )}

                {!hideCloseButton && (
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Cerrar"
                      className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C49A]/50"
                    >
                      <X className="h-5 w-5" strokeWidth={2} />
                    </button>
                  </Dialog.Close>
                )}
              </div>
            </header>
          )}

          <div
            className={cn(
              "scrollbar-modal min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pb-6 pt-6",
              !showHeader && "rounded-t-2xl",
              !showHeader && fullScreenOnSmallViewports && "max-md:rounded-t-none",
            )}
          >
            {children}
          </div>
          </ModalContentContainerContext.Provider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
