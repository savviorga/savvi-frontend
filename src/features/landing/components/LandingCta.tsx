import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import Reveal from "./Reveal";

const bullets = [
  "Creas la cuenta en menos de un minuto",
  "Sin tarjeta de crédito ni periodo de prueba",
  "Puedes borrar tu cuenta y tus datos cuando quieras",
] as const;

export default function LandingCta() {
  return (
    <section className="bg-white px-5 py-20 sm:px-8 sm:py-24">
      <Reveal className="mx-auto w-full max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-mint/25 bg-gradient-to-br from-mint/15 via-white to-sky-100/50 px-6 py-14 text-center sm:px-14">
          <div
            className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-mint/25 blur-3xl savvi-float"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -right-10 size-64 rounded-full bg-sky-300/30 blur-3xl savvi-float-slow"
            aria-hidden
          />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight text-[#0a1628] sm:text-4xl">
              El mejor momento para ordenar tu dinero fue hace un año. El
              segundo mejor es{" "}
              <span className="relative inline-block">
                <span
                  className="absolute inset-x-[-6px] bottom-1 h-4 rounded bg-mint/40"
                  aria-hidden
                />
                <span className="relative">hoy.</span>
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600">
              Crea tu cuenta gratis y registra tu primer movimiento en menos de
              un minuto. Sin plantillas, sin fórmulas, sin excusas.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-mint px-8 text-base font-bold text-[#011627] shadow-[0_16px_40px_-14px_rgba(0,212,170,1)] transition-all hover:bg-mint-dim active:scale-[0.98] sm:w-auto"
              >
                Crear mi cuenta gratis
                <ArrowRight
                  className="size-5 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-13 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-8 text-base font-semibold text-[#0a1628] shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Iniciar sesión
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
          </div>
        </div>
      </Reveal>
    </section>
  );
}
