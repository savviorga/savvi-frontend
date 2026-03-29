"use client";

import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

/** Paleta marca (banner home) */
const MINT = "#00C49A";
const SURFACE = "#FFFFFF";
const SURFACE_SECONDARY = "#F3F4F6";

export type SavvyBannerHomeStat = {
  label: string;
  value: string;
  /** Etiqueta pequeña junto al título (p. ej. «Automático») */
  tag?: string;
  hint?: string;
  /** Color del valor principal (por defecto mint) */
  valueTone?: "mint" | "rose" | "navy" | "foreground" | "amber";
};

interface SavvyBannerProps {
  title: string;
  subtitle?: string;
  /** Texto de la pastilla superior (p. ej. «Dashboard», «Planificador») */
  badgeLabel?: string;
  /** Dos o tres bloques bajo el título; si no se envía, se usan datos de ejemplo (Storybook / home). */
  stats?: SavvyBannerHomeStat[];
}

const DEFAULT_STATS: SavvyBannerHomeStat[] = [
  { label: "Balance", value: "$12,450.00", valueTone: "mint" },
  { label: "Ingresos", value: "+$3,200.00", valueTone: "mint" },
  { label: "Transacciones", value: "47 este mes", valueTone: "mint" },
];

function statValueClass(tone: SavvyBannerHomeStat["valueTone"]) {
  switch (tone) {
    case "rose":
      return "text-rose-600";
    case "navy":
      return "text-[#0B1829]";
    case "foreground":
      return "text-gray-900";
    case "amber":
      return "text-amber-600";
    case "mint":
    default:
      return "";
  }
}

export default function SavvyBannerHome({
  title,
  subtitle,
  badgeLabel = "Dashboard",
  stats,
}: SavvyBannerProps) {
  const statBlocks =
    stats?.length === 2 || stats?.length === 3 ? stats : DEFAULT_STATS;
  return (
    <section
      style={{ backgroundColor: SURFACE }}
      className="relative mb-8 w-full overflow-hidden rounded-2xl border border-gray-200/90 p-8 shadow-lg shadow-gray-200/40"
    >
      {/* Acento superior: mint → navy → mint */}
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r"
        style={{
          backgroundImage: `linear-gradient(to right, ${MINT}, ${MINT}, ${MINT})`,
        }}
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(to bottom right, color-mix(in srgb, ${MINT} 22%, transparent), color-mix(in srgb, ${MINT} 12%, transparent))`,
          }}
        />
        <div
          className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(to top right, color-mix(in srgb, ${MINT} 14%, transparent), color-mix(in srgb, ${MINT} 8%, transparent))`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${MINT} 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative z-10 flex items-start justify-between">
        <div className="max-w-2xl">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1"
            style={{
              borderColor: `color-mix(in srgb, ${MINT} 35%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${MINT} 10%, ${SURFACE})`,
            }}
          >
            <TrendingUp
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: MINT }}
              aria-hidden
            />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: MINT }}
            >
              {badgeLabel}
            </span>
          </div>

          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: MINT }}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-lg leading-relaxed text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        <div className="hidden shrink-0 lg:block">
          <div className="relative">
            <div
              className="absolute -inset-3 rounded-2xl blur-xl"
              style={{
                background: `linear-gradient(to bottom right, color-mix(in srgb, ${MINT} 25%, transparent), color-mix(in srgb, ${MINT} 20%, transparent))`,
              }}
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background: `linear-gradient(to bottom right, ${MINT}, ${MINT})`,
                boxShadow: `0 10px 40px -10px color-mix(in srgb, ${MINT} 45%, transparent)`,
              }}
            >
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative z-10 mt-6 flex flex-wrap gap-6 border-t pt-6"
        style={{ borderColor: SURFACE_SECONDARY }}
      >
        {statBlocks.map((stat, index) => (
          <div
            key={`${stat.label}-${index}`}
            className="flex items-center gap-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: SURFACE_SECONDARY }}
            >
              {index === 0 && (
                <svg
                  className="h-5 w-5"
                  style={{ color: MINT }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {index === 1 && (
                <svg
                  className="h-5 w-5"
                  style={{ color: MINT }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                  />
                </svg>
              )}
              {index === 2 && statBlocks.length > 2 && (
                <svg
                  className="h-5 w-5"
                  style={{ color: MINT }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"
                  />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  {stat.label}
                </p>
                {stat.tag ? (
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${MINT} 15%, ${SURFACE})`,
                      color: "#0B1829",
                    }}
                  >
                    {stat.tag}
                  </span>
                ) : null}
              </div>
              <p
                className={cn(
                  "text-lg font-bold tabular-nums",
                  statValueClass(stat.valueTone),
                )}
                style={
                  stat.valueTone === "mint" || stat.valueTone === undefined
                    ? { color: MINT }
                    : undefined
                }
              >
                {stat.value}
              </p>
              {stat.hint ? (
                <p
                  className={cn(
                    "mt-0.5 text-xs text-gray-500",
                    stat.valueTone === "amber" && "text-amber-700/90",
                  )}
                >
                  {stat.hint}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
