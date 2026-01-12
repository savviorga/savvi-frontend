"use client";

import { XCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ErrorAlertProps {
  errors: string[];
  onClose?: () => void;
  title?: string;
}

export default function ErrorAlert({
  errors,
  onClose,
  title = "Error",
}: ErrorAlertProps) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        {/* Icono */}
        <XCircleIcon className="h-5 w-5 flex-shrink-0 text-red-500" />

        {/* Contenido */}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>

          {errors.length === 1 ? (
            <p className="mt-1 text-sm text-red-700">{errors[0]}</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Botón cerrar */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1 text-red-500 transition hover:bg-red-100"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
