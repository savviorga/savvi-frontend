"use client";

import { useState } from "react";

interface DeleteButtonProps {
  onDelete: () => Promise<void> | void;
  confirmMessage?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function DeleteButton({
  onDelete,
  confirmMessage = "¿Eliminar? Esta acción no se puede deshacer.",
  label = "Eliminar",
  disabled = false,
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
      className={
        className ??
        "rounded-xl border border-rose-200 px-3 py-1 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
      }
    >
      {loading ? "Eliminando..." : label}
    </button>
  );
}

