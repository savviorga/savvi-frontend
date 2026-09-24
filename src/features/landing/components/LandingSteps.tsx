import Image from "next/image";
import Reveal from "./Reveal";

const steps = [
  {
    number: "01",
    image: "/landing/paso-registrar.svg",
    alt: "Formulario de Savvi para registrar un gasto con ayuda de Savvi IA",
    title: "Registra el movimiento",
    description:
      "Monto, categoría y cuenta en tres toques. O descríbelo en una frase y deja que Savvi IA arme el registro por ti.",
  },
  {
    number: "02",
    image: "/landing/paso-organizar.svg",
    alt: "Lista de categorías con barras de presupuesto mensual",
    title: "Ponle límites al mes",
    description:
      "Asigna un presupuesto por categoría y observa en vivo cuánto llevas gastado y cuánto te queda disponible.",
  },
  {
    number: "03",
    image: "/landing/paso-entender.svg",
    alt: "Gráfico de evolución mensual de gastos con tendencia a la baja",
    title: "Entiende tu mes",
    description:
      "Reportes que comparan meses y categorías para que veas el patrón detrás de los gastos, no solo la cifra.",
  },
] as const;

export default function LandingSteps() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-dim">
            Cómo funciona
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0a1628] sm:text-4xl">
            De un gasto suelto a un mes bajo control
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-500">
            Tres pasos que se vuelven costumbre en la primera semana.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {steps.map(({ number, image, alt, title, description }, index) => (
            <Reveal key={number} delay={index * 120}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-mint/40 hover:shadow-xl hover:shadow-mint/10">
                <div className="relative overflow-hidden bg-slate-50">
                  <Image
                    src={image}
                    alt={alt}
                    width={400}
                    height={300}
                    unoptimized
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-56"
                  />
                  <span className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-lg bg-[#011627] text-xs font-bold text-mint">
                    {number}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-base font-bold text-[#0a1628]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {description}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
