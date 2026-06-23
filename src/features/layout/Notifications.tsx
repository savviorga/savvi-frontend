"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useTransferTemplates } from "@/features/transfer-templates/hooks/useTransferTemplates";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Notifications() {
  const { templates, loading } = useTransferTemplates({ silent: true });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const overdueTemplates = useMemo(() => {
    const today = todayISO();
    return templates
      .filter((template) => template.isActive && template.nextDueDate < today)
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  }, [templates]);

  const count = overdueTemplates.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-offset-2"
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-200/50">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
            <p className="text-xs text-slate-500">
              Pagos recurrentes vencidos
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {loading ? (
              <p className="px-3 py-3 text-sm text-slate-500">Cargando...</p>
            ) : count === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-500">
                No tienes pagos recurrentes vencidos.
              </p>
            ) : (
              overdueTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg px-3 py-2 transition hover:bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {template.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {template.payeeName} - Vencido desde {template.nextDueDate}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-3 py-2">
            <Link
              href="/transferencias"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-mint transition hover:opacity-90"
            >
              Ver pagos recurrentes
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
