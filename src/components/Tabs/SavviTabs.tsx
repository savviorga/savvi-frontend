"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ComponentType, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export type SavviTabItem<T extends string> = {
  id: T;
  label: string;
  /** Ícono opcional (lucide o heroicons) */
  icon?: ComponentType<{ className?: string }>;
  /** Contador opcional; no se muestra si es 0 */
  count?: number;
};

type SavviTabsProps<T extends string> = {
  tabs: SavviTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  /** Se queda fija bajo el header al hacer scroll */
  sticky?: boolean;
  className?: string;
};

/**
 * Pestañas globales de Savvi: pastilla oscura que se desliza hasta la pestaña activa.
 * Cada botón tiene id `tab-<id>` para enlazarlo con `aria-labelledby` en su panel.
 */
export default function SavviTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel = "Pestañas",
  sticky = false,
  className,
}: SavviTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  // Mide la pestaña activa; se repite si cambia de tamaño (p. ej. cuando llega un contador).
  useLayoutEffect(() => {
    const el = tabRefs.current[value];
    const list = listRef.current;
    if (!el || !list) return;

    const measure = () =>
      setIndicator((prev) => ({ left: el.offsetLeft, width: el.offsetWidth, ready: prev.ready || el.offsetWidth > 0 }));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, tabs]);

  const select = (id: T) => {
    onChange(id);
    tabRefs.current[id]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.id === value);
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === -1) return;

    e.preventDefault();
    const id = tabs[next].id;
    select(id);
    tabRefs.current[id]?.focus();
  };

  return (
    <div
      className={cn(
        "-mx-1 overflow-x-auto px-1 py-0.5 scrollbar-none",
        sticky && "sticky top-[76px] z-20",
        className,
      )}
    >
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className="relative inline-flex min-w-full gap-1 rounded-2xl border border-gray-200/90 bg-white/90 p-1.5 shadow-sm backdrop-blur sm:min-w-0"
      >
        <span
          className={cn(
            "absolute inset-y-1.5 rounded-xl bg-[#0B1829] shadow-md",
            indicator.ready ? "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" : "opacity-0",
          )}
          style={{ left: indicator.left, width: indicator.width }}
          aria-hidden
        />
        {tabs.map(({ id, label, icon: Icon, count }) => {
          const active = value === id;
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el;
              }}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => select(id)}
              className={cn(
                "relative z-10 inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50 sm:flex-none",
                active ? "text-white" : "text-gray-500 hover:text-[#0B1829]",
              )}
            >
              {Icon && (
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors duration-300", active && "text-mint")} />
              )}
              {label}
              {!!count && count > 0 && (
                <span
                  className={cn(
                    "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors duration-300",
                    active ? "bg-mint/20 text-mint" : "bg-gray-100 text-gray-500",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
