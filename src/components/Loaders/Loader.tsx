import { cn } from "@/lib/utils";

export interface LoaderProps {
  /** Texto bajo el spinner. Cadena vacía oculta el texto. */
  label?: string;
  className?: string;
}

export default function Loader({
  label = "Cargando información...",
  className,
}: LoaderProps) {
  return (
    <div
      className={cn("flex flex-col items-center gap-3", className)}
      role="status"
      aria-live="polite"
    >
      <div className="relative h-10 w-10" aria-hidden>
        <div className="absolute inset-0 rounded-full border-[3px] border-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#00C49A]" />
      </div>
      {label !== "" && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
