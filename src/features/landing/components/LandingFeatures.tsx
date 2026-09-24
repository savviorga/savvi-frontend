import {
  BarChart3,
  CalendarClock,
  Layers,
  Repeat2,
  Sparkles,
  Target,
} from "lucide-react";
import Reveal from "./Reveal";

const features = [
  {
    icon: Layers,
    title: "Registra en segundos",
    description:
      "Ingresos y egresos con categoría, cuenta y fecha. Sin campos de más ni pasos innecesarios.",
  },
  {
    icon: Target,
    title: "Presupuestos que avisan",
    description:
      "Pon un límite mensual por categoría y mira en vivo cuánto llevas gastado y cuánto te queda.",
  },
  {
    icon: CalendarClock,
    title: "Planificador de deudas",
    description:
      "Organiza cuotas y pagos recurrentes, registra cada abono y observa cómo baja el saldo.",
  },
  {
    icon: Repeat2,
    title: "Cuentas y transferencias",
    description:
      "Mueve dinero entre tus cuentas con plantillas reutilizables y mantén cada saldo al día.",
  },
  {
    icon: BarChart3,
    title: "Reportes que se entienden",
    description:
      "Balance del mes, evolución por categoría y comparativos. Las cifras contadas en español claro.",
  },
  {
    icon: Sparkles,
    title: "Savvi IA",
    description:
      "Describe el gasto como lo dirías en voz alta y la IA propone el movimiento: tú solo confirmas.",
  },
] as const;

export default function LandingFeatures() {
  return (
    <section id="funciones" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-dim">
            Todo en un solo lugar
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0a1628] sm:text-4xl">
            Lo que necesitas para cerrar el mes sin sustos
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-500">
            Nada de módulos que nunca usas. Savvi hace bien las cosas que de
            verdad mueven tus finanzas del día a día.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={(index % 3) * 100}>
              <article className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-mint/40 hover:shadow-xl hover:shadow-mint/10">
                <span className="flex size-11 items-center justify-center rounded-xl bg-mint/10 text-mint-dim transition-colors group-hover:bg-mint group-hover:text-white">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-base font-bold text-[#0a1628]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
