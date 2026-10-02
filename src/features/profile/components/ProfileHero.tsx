"use client";

import { CalendarDays, Clock3, Mail } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface ProfileHeroProps {
  name: string;
  email: string;
  memberSince: string;
  daysActive: number;
  /** % histórico; null si no hay ingresos */
  savingsRate: number | null;
}

function initialsFromName(name: string) {
  if (!name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const RING_RADIUS = 34;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function SavingsRing({ value }: { value: number | null }) {
  const animated = useCountUp(value ?? 0, 1400, 300);
  // El anillo solo se llena entre 0 y 100; el número muestra el valor real (puede ser negativo).
  const fill = Math.min(Math.max(animated, 0), 100);
  const offset = RING_LENGTH * (1 - fill / 100);
  const negative = value !== null && value < 0;

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={RING_RADIUS} fill="none" strokeWidth="7" className="stroke-white/10" />
        <circle
          cx="40"
          cy="40"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          stroke="url(#profile-ring)"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="profile-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00d4aa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-bold tabular-nums ${
          negative ? "text-rose-300" : "text-white"
        } ${Math.abs(animated) >= 100 ? "text-sm" : "text-lg"}`}
      >
        {value === null ? "—" : `${Math.round(animated)}%`}
      </span>
    </div>
  );
}

function ringCaption(value: number | null) {
  if (value === null) return "Registra tus ingresos para calcular cuánto ahorras.";
  if (value < 0) return "Tus gastos superan tus ingresos registrados.";
  if (value < 20) return "Vas bien. La meta recomendada es ahorrar el 20%.";
  return "¡Excelente! Ahorras más del 20% de lo que ganas.";
}

export default function ProfileHero({ name, email, memberSince, daysActive, savingsRate }: ProfileHeroProps) {
  return (
    <section className="savvi-profile-rise relative overflow-hidden rounded-3xl bg-[#0A1622] text-white shadow-xl shadow-slate-900/20">
      {/* Fondo animado */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="savvi-float absolute -right-16 -top-24 h-72 w-72 rounded-full bg-mint/25 blur-3xl" />
        <div className="savvi-float-slow absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
      </div>

      <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          {/* Avatar */}
          <div className="relative shrink-0">
            <span className="savvi-pulse-ring absolute inset-0 rounded-full bg-mint/40" aria-hidden />
            <div
              className="savvi-profile-spin absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,#00d4aa,#22d3ee,#0A1622,#00d4aa)]"
              aria-hidden
            />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#0A1622] bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 text-3xl font-bold text-white">
              {initialsFromName(name)}
            </div>
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-mint">Mi perfil</p>
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{name || "Tu nombre"}</h1>
            <p className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm text-slate-400">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{email}</span>
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-slate-300 sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-mint" />
                Miembro desde {memberSince}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-mint" />
                {daysActive.toLocaleString("es-CO")} días con Savvi
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 self-center rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm lg:self-auto">
          <SavingsRing value={savingsRate} />
          <div>
            <p className="text-sm font-semibold">Tasa de ahorro histórica</p>
            <p className="mt-0.5 max-w-[190px] text-xs text-slate-400">{ringCaption(savingsRate)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
