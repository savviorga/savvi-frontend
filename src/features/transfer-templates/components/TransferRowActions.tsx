"use client";

import { useState } from "react";
import {
  Banknote,
  Eye,
  EllipsisVertical,
  Pause,
  Pencil,
  Play,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TransferTemplate } from "../types/transfer.types";

function MenuItem({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

/** Acción principal visible ("Pagar") y el resto en un menú de tres puntos. */
export default function TransferRowActions({
  template,
  onPay,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  template: TransferTemplate;
  onPay: () => void;
  onView: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  /** Devuelve `true` si se eliminó. */
  onDelete: () => Promise<boolean>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={onPay}
        disabled={!template.isActive}
        title={template.isActive ? undefined : "Activa la plantilla para poder pagar"}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-mint px-4 text-sm font-semibold text-cosmos shadow-sm transition-all hover:bg-mint-dim active:scale-[.98] disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50"
      >
        <Banknote className="h-4 w-4" />
        Pagar
      </button>

      <Popover
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
          if (!open) setConfirmDelete(false);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Más acciones para ${template.name}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#0B1829] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50 data-[state=open]:bg-gray-100 data-[state=open]:text-[#0B1829]"
          >
            <EllipsisVertical className="h-5 w-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 rounded-xl p-1.5" role="menu">
          <MenuItem icon={Eye} label="Ver detalle" onClick={run(onView)} />
          <MenuItem icon={Pencil} label="Editar" onClick={run(onEdit)} />
          <MenuItem
            icon={template.isActive ? Pause : Play}
            label={template.isActive ? "Pausar" : "Activar"}
            onClick={run(onToggleActive)}
          />
          <div className="my-1 h-px bg-gray-100" aria-hidden />
          <MenuItem
            icon={Trash2}
            label={confirmDelete ? "¿Confirmar eliminación?" : "Eliminar"}
            className={cn(
              "text-rose-600 hover:bg-rose-50 focus:bg-rose-50",
              confirmDelete && "bg-rose-50 font-semibold"
            )}
            onClick={async () => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              if (await onDelete()) setMenuOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
