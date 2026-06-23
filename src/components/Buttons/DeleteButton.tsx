"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteButtonProps {
  onDelete: () => Promise<void> | void;
  confirmMessage?: string;
  label?: string;
  disabled?: boolean;
  showIcon?: boolean;
  className?: string;
}

export default function DeleteButton({
  onDelete,
  confirmMessage = "¿Eliminar? Esta acción no se puede deshacer.",
  label = "Eliminar",
  disabled = false,
  showIcon = true,
  className,
}: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={async () => {
        if (disabled || loading) return;

        const ok = window.confirm(confirmMessage);
        if (!ok) return;

        try {
          setLoading(true);
          await onDelete();
        } finally {
          setLoading(false);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
      ) : showIcon ? (
        <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : null}
      {loading ? "Eliminando…" : label}
    </button>
  );
}

