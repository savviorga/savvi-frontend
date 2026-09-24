import Link from "next/link";
import { ArrowRight, Check, Clock, Lock, Sparkles } from "lucide-react";
import AppPreview from "./AppPreview";
import Reveal from "./Reveal";

const bullets = [
  "Gratis para empezar",
  "Sin tarjeta de crédito",
  "En pesos colombianos",
] as const;

const highlights = [
  {
    icon: Clock,
    title: "3 minutos al día",
    description: "Lo que toma registrar tu día y seguir con tu vida.",
  },
  {
    icon: Sparkles,
    title: "Escríbelo como hablas",
    description: "“Almorcé 25 mil” y Savvi IA lo convierte en un movimiento.",
  },
  {
    icon: Lock,
    title: "Solo tú lo ves",
    description: "Tus movimientos viajan y se guardan cifrados.",
  },
] as const;

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-mint/[0.08] via-white to-white pb-20 pt-10 sm:pb-24 sm:pt-14">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-mint/15 blur-[130px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(2,22,39,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(2,22,39,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-mint savvi-pulse-ring" />
              <span className="relative inline-flex size-2 rounded-full bg-mint" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mint-dim">
              Finanzas personales, sin hojas de cálculo
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-[#0a1628] sm:text-5xl lg:text-[3.4rem]">
            Sabe exactamente{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span
                className="absolute inset-x-[-6px] bottom-1.5 h-4 rounded bg-mint/35 sm:h-5"
                aria-hidden
              />
              <span className="relative">a dónde se va</span>
            </span>{" "}
            tu dinero.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Savvi reúne tus ingresos, gastos, presupuestos y deudas en un solo
            lugar. Registras en segundos y ves el panorama completo del mes, sin
            fórmulas ni plantillas que nadie mantiene.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-mint px-7 text-base font-bold text-[#011627] shadow-[0_16px_40px_-14px_rgba(0,212,170,1)] transition-all hover:bg-mint-dim hover:shadow-[0_20px_50px_-14px_rgba(0,212,170,1)] active:scale-[0.98]"
            >
              Crear mi cuenta gratis
              <ArrowRight
                className="size-5 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-13 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-base font-semibold text-[#0a1628] shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-center gap-1.5 text-xs text-slate-500"
              >
                <Check className="size-3.5 text-mint-dim" strokeWidth={3} aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150}>
          <AppPreview />
        </Reveal>
      </div>

      <div className="relative mx-auto mt-20 w-full max-w-6xl px-5 sm:mt-24 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 100}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-mint/40 hover:shadow-lg hover:shadow-mint/10">
                <span className="flex size-10 items-center justify-center rounded-xl bg-mint/10 text-mint-dim">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-sm font-bold text-[#0a1628]">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
