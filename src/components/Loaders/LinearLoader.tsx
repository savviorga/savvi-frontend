import { cn } from "@/lib/utils";

const MINT = "#00C49A";

export interface LinearLoaderProps {
  /** Texto bajo la barra. Cadena vacía oculta el texto. */
  label?: string;
  className?: string;
  /** Altura de la pista (por defecto 4px) */
  trackClassName?: string;
}

export default function LinearLoader({
  label = "Cargando información...",
  className,
  trackClassName,
}: LinearLoaderProps) {
  return (
    <div
      className={cn("w-full", className)}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          trackClassName ?? "h-1"
        )}
        aria-hidden
      >
        <div
          className="absolute top-0 left-0 h-full w-[38%] max-w-[280px] rounded-full"
          style={{
            backgroundColor: MINT,
            animation: "savvi-linear-loader 1.25s ease-in-out infinite",
            willChange: "transform",
          }}
        />
      </div>
      {label !== "" && (
        <span className="mt-2 block text-center text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
