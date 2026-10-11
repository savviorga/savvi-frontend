"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Banknote, Bell, PartyPopper } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMoney } from "@/features/dashboard/utils/dashboard.utils";
import DueStatus from "@/features/transfer-templates/components/DueStatus";
import ServiceAvatar from "@/features/transfer-templates/components/ServiceAvatar";
import { useTransferTemplates } from "@/features/transfer-templates/hooks/useTransferTemplates";
import type { TransferTemplate } from "@/features/transfer-templates/types/transfer.types";
import {
  cleanTemplateName,
  daysUntilDue,
} from "@/features/transfer-templates/utils/schedule";
import { cn } from "@/lib/utils";

/** Se avisan los pagos vencidos y los que vencen en la próxima semana. */
const UPCOMING_DAYS = 7;
/** Con más ítems se enlaza a la página en vez de hacer scroll dentro del panel. */
const MAX_ITEMS = 5;

type Filter = "all" | "overdue" | "upcoming";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "overdue", label: "Vencidos" },
  { id: "upcoming", label: "Próximos" },
];

const PAGE = "/pagos-recurrentes";

function NotificationItem({
  template,
  index,
  onNavigate,
}: {
  template: TransferTemplate;
  index: number;
  onNavigate: () => void;
}) {
  return (
    <li
      className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 animate-in fade-in-0 slide-in-from-right-2 fill-mode-both duration-300"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <ServiceAvatar template={template} />

      {/* El enlace cubre todo el ítem; "Pagar" queda por encima con z-10. */}
      <Link
        href={`${PAGE}?ver=${template.id}`}
        onClick={onNavigate}
        className="min-w-0 flex-1 focus:outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-mint/50"
      >
        <p className="truncate text-sm font-semibold text-slate-900">
          {template.payeeName}
        </p>
        <p className="truncate text-xs text-slate-500">
          {cleanTemplateName(template.name)}
        </p>
        <DueStatus
          nextDueDate={template.nextDueDate}
          className="mt-1 text-xs [&>svg]:h-3.5 [&>svg]:w-3.5"
        />
      </Link>

      <div className="relative z-10 flex shrink-0 flex-col items-end gap-1.5">
        {template.lastAmount != null && (
          <span className="text-sm font-bold tabular-nums text-slate-900">
            {formatMoney(Number(template.lastAmount))}
          </span>
        )}
        <Link
          href={`${PAGE}?pagar=${template.id}`}
          onClick={onNavigate}
          className="inline-flex h-7 items-center gap-1 rounded-lg bg-mint px-2.5 text-xs font-semibold text-cosmos shadow-sm transition-all hover:bg-mint-dim active:scale-[.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50"
        >
          <Banknote className="h-3.5 w-3.5" />
          Pagar
        </Link>
      </div>
    </li>
  );
}

export default function Notifications() {
  const { templates, loading, reload } = useTransferTemplates({ silent: true });
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const { overdue, upcoming, urgentCount, overdueTotal } = useMemo(() => {
    const withDays = templates
      .filter((t) => t.isActive)
      .map((t) => ({ t, days: daysUntilDue(t.nextDueDate) }))
      .filter(({ days }) => days <= UPCOMING_DAYS)
      .sort((a, b) => a.days - b.days);

    const overdueList = withDays.filter(({ days }) => days < 0).map(({ t }) => t);
    return {
      overdue: overdueList,
      upcoming: withDays.filter(({ days }) => days >= 0).map(({ t }) => t),
      // El número rojo de la campana: lo que está en rojo en el semáforo (≤ 3 días).
      urgentCount: withDays.filter(({ days }) => days <= 3).length,
      overdueTotal: overdueList.reduce((acc, t) => acc + Number(t.lastAmount ?? 0), 0),
    };
  }, [templates]);

  const items =
    filter === "overdue" ? overdue : filter === "upcoming" ? upcoming : [...overdue, ...upcoming];
  const visibleItems = items.slice(0, MAX_ITEMS);
  const hiddenCount = items.length - visibleItems.length;
  const counts: Record<Filter, number> = {
    all: overdue.length + upcoming.length,
    overdue: overdue.length,
    upcoming: upcoming.length,
  };

  const close = () => setOpen(false);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // La campana vive en el header y no se vuelve a montar: refresca al abrir.
        if (next) void reload();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-offset-2 data-[state=open]:border-mint/40 data-[state=open]:bg-mint/5 data-[state=open]:text-slate-900",
            urgentCount > 0 ? "border-rose-200" : "border-slate-200"
          )}
          aria-label={
            urgentCount > 0
              ? `Notificaciones: ${urgentCount} pagos urgentes`
              : "Notificaciones"
          }
        >
          {/* `key` vuelve a montar el ícono para repetir la sacudida si aumentan los urgentes. */}
          <Bell
            key={urgentCount}
            className={cn("h-5 w-5", urgentCount > 0 && "animate-bell-ring")}
          />
          {urgentCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-rose-500 opacity-60 motion-safe:animate-ping [animation-iteration-count:3]" />
              <span className="relative inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white animate-in zoom-in-50 duration-300">
                {urgentCount > 9 ? "9+" : urgentCount}
              </span>
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[23rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border-slate-200/80 p-0 shadow-xl shadow-slate-300/40"
      >
        {/* Encabezado */}
        <div className="relative overflow-hidden border-b border-slate-100 px-4 pb-3 pt-4">
          <div
            className={cn(
              "pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl",
              overdue.length ? "bg-rose-400/15" : "bg-mint/15"
            )}
            aria-hidden
          />
          <div className="relative">
            <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {overdue.length > 0 ? (
                <>
                  Tienes{" "}
                  <span className="font-semibold text-rose-600">
                    {formatMoney(overdueTotal)}
                  </span>{" "}
                  en pagos vencidos
                </>
              ) : counts.all > 0 ? (
                `Pagos de los próximos ${UPCOMING_DAYS} días`
              ) : (
                "Pagos recurrentes"
              )}
            </p>
          </div>

          {counts.all > 0 && (
            <div
              role="tablist"
              aria-label="Filtrar notificaciones"
              className="relative mt-3 flex gap-1 rounded-xl bg-slate-100 p-1"
            >
              {FILTERS.map(({ id, label }) => {
                const active = filter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(id)}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50",
                      active
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[10px] tabular-nums",
                        active && id === "overdue" && counts.overdue
                          ? "bg-rose-100 text-rose-600"
                          : active
                            ? "bg-mint/15 text-mint-dim"
                            : "bg-slate-200/70 text-slate-500"
                      )}
                    >
                      {counts[id]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Lista: máximo MAX_ITEMS, sin scroll dentro del panel */}
        <div className="p-1.5">
          {loading && templates.length === 0 ? (
            <ul className="space-y-1 p-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-3 px-2 py-2">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />
                  </div>
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-8 text-center animate-in fade-in-0 zoom-in-95 duration-300">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <PartyPopper className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {filter === "all" ? "¡Estás al día!" : "Nada por aquí"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {filter === "overdue"
                  ? "No tienes pagos vencidos."
                  : `No hay pagos que venzan en los próximos ${UPCOMING_DAYS} días.`}
              </p>
            </div>
          ) : (
            // `key` reinicia la animación escalonada al cambiar de filtro.
            <ul key={filter} className="space-y-0.5">
              {visibleItems.map((template, index) => (
                <NotificationItem
                  key={template.id}
                  template={template}
                  index={index}
                  onNavigate={close}
                />
              ))}
            </ul>
          )}
        </div>

        <Link
          href={PAGE}
          onClick={close}
          className="group/footer flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-mint-dim transition-colors hover:bg-mint/5 focus:outline-none focus-visible:bg-mint/5"
        >
          {hiddenCount > 0
            ? `Ver ${hiddenCount} ${hiddenCount === 1 ? "pago más" : "pagos más"} en Transferencias`
            : "Ver todas las transferencias"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover/footer:translate-x-0.5" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
