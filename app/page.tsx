import type { Metadata } from "next";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import LandingNav from "@/features/landing/components/LandingNav";
import LandingHero from "@/features/landing/components/LandingHero";
import LandingSteps from "@/features/landing/components/LandingSteps";
import LandingFeatures from "@/features/landing/components/LandingFeatures";
import BudgetCalculator from "@/features/landing/components/BudgetCalculator";
import LandingGuides from "@/features/landing/components/LandingGuides";
import LandingFaq from "@/features/landing/components/LandingFaq";
import LandingCta from "@/features/landing/components/LandingCta";
import LandingFooter from "@/features/landing/components/LandingFooter";
import Reveal from "@/features/landing/components/Reveal";

export const metadata: Metadata = {
  title: "Savvi — Controla tu dinero sin hojas de cálculo",
  description:
    "Registra ingresos y gastos, arma presupuestos y entiende a dónde se va tu dinero. Además, guías y una calculadora 50/30/20 gratis, sin crear cuenta.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      <main>
        <LandingHero />
        <LandingSteps />
        <LandingFeatures />

        <section
          id="calculadora"
          className="scroll-mt-20 bg-slate-50 py-20 sm:py-24"
        >
          <div className="mx-auto grid w-full max-w-6xl items-start gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.05fr]">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1.5">
                <GraduationCap className="size-4 text-mint-dim" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mint-dim">
                  Gratis, sin crear cuenta
                </span>
              </span>

              <h2 className="mt-6 text-3xl font-bold tracking-tight text-[#0a1628] sm:text-4xl">
                Reparte tu sueldo con la regla 50/30/20
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Es el punto de partida más usado para ordenar un presupuesto: la
                mitad del ingreso para lo que necesitas, un tercio para lo que
                disfrutas y una quinta parte para tu futuro.
              </p>

              <Image
                src="/landing/regla-503020.svg"
                alt="Gráfico circular con el reparto del ingreso: 50% necesidades, 30% gustos y 20% ahorro"
                width={400}
                height={300}
                unoptimized
                className="mt-8 w-full max-w-md rounded-2xl border border-slate-200 bg-white"
              />

              <p className="mt-8 text-base leading-relaxed text-slate-600">
                Escribe cuánto recibes al mes y mira los números de tu caso. No
                pedimos correo, no guardamos nada: el cálculo ocurre en tu
                navegador.
              </p>

              <dl className="mt-8 space-y-4">
                <div className="border-l-2 border-mint pl-4">
                  <dt className="text-sm font-bold text-[#0a1628]">
                    ¿Y si las necesidades no me caben en el 50%?
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-slate-500">
                    Es normal en ciudades con arriendos altos. Usa 60/20/20 y
                    protege el 20% de ahorro: esa es la parte que no se negocia.
                  </dd>
                </div>
                <div className="border-l-2 border-slate-200 pl-4">
                  <dt className="text-sm font-bold text-[#0a1628]">
                    ¿Ingresos variables?
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-slate-500">
                    Calcula sobre el promedio de tus tres meses más bajos. Lo
                    que entre por encima, va directo al ahorro.
                  </dd>
                </div>
              </dl>
            </Reveal>

            <Reveal delay={120}>
              <BudgetCalculator />
            </Reveal>
          </div>
        </section>

        <section id="guias" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
            <Reveal className="flex flex-col items-center text-center">
              <Image
                src="/landing/guias-aprende.svg"
                alt="Ilustración de un cuaderno abierto con apuntes de finanzas personales"
                width={400}
                height={300}
                unoptimized
                className="w-full max-w-xs savvi-float"
              />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-mint-dim">
                Aprende gratis
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0a1628] sm:text-4xl">
                Seis guías que valen más que cualquier app
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                Lo esencial de finanzas personales, sin humo ni promesas de
                hacerte rico. Léelas aquí mismo: no hay que registrarse ni dejar
                el correo.
              </p>
            </Reveal>

            <LandingGuides />
          </div>
        </section>

        <section
          id="preguntas"
          className="scroll-mt-20 bg-slate-50 py-20 sm:py-24"
        >
          <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-dim">
                Preguntas frecuentes
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0a1628] sm:text-4xl">
                Lo que suelen preguntarnos antes de empezar
              </h2>
            </Reveal>

            <LandingFaq />
          </div>
        </section>

        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  );
}
