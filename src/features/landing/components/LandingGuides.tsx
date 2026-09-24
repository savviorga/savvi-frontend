"use client";

import { useState } from "react";
import {
  BookOpen,
  Coins,
  CreditCard,
  LifeBuoy,
  ListChecks,
  Scale,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Guide {
  id: string;
  icon: LucideIcon;
  title: string;
  summary: string;
  points: string[];
}

const guides: Guide[] = [
  {
    id: "fondo",
    icon: LifeBuoy,
    title: "Cómo armar tu fondo de emergencia",
    summary: "El colchón que evita que un imprevisto se convierta en deuda.",
    points: [
      "Calcula de 3 a 6 meses de tus gastos básicos, no de tu ingreso: es una cifra bastante más alcanzable.",
      "Guárdalo en una cuenta distinta a la del día a día, líquida y sin tarjeta asociada, para no usarlo por inercia.",
      "Empieza con una meta pequeña: un solo mes de gastos ya te saca de la mayoría de los apuros.",
      "Programa la transferencia el mismo día que te pagan. Lo que no ves en la cuenta, no se gasta.",
      "Úsalo solo en emergencias reales: pérdida de ingreso, salud o una reparación que no puede esperar.",
    ],
  },
  {
    id: "deudas",
    icon: Scale,
    title: "Bola de nieve o avalancha: cómo salir de deudas",
    summary: "Dos métodos probados. El mejor es el que logras sostener.",
    points: [
      "Avalancha: abona primero a la deuda con la tasa de interés más alta. Es la que menos intereses te cuesta al final.",
      "Bola de nieve: liquida primero la deuda más pequeña. Rinde menos en plata, pero la motivación de cerrar una deuda es real.",
      "Mientras atacas una, paga el mínimo de todas las demás para no caer en mora ni sumar costos.",
      "Cada deuda que cierras libera su cuota: destínala completa a la siguiente y el avance se acelera solo.",
      "Antes de acelerar pagos, ten al menos un mes de gastos ahorrado; si no, la próxima emergencia te devuelve al punto de partida.",
    ],
  },
  {
    id: "hormiga",
    icon: Coins,
    title: "Gastos hormiga: encuéntralos sin dejar de vivir",
    summary: "No es dejar el café. Es saber cuánto cuesta el café.",
    points: [
      "Suma un mes completo de compras menores a $30.000. La cifra casi siempre sorprende.",
      "Revisa las suscripciones que se renuevan solas y cancela lo que no hayas usado en los últimos 60 días.",
      "Dales categoría propia (“café”, “domicilios”, “apps”) para que aparezcan en el reporte en vez de esconderse en “varios”.",
      "No los elimines todos: elige dos, ponles un tope semanal y deja el resto en paz. Los presupuestos de castigo no duran.",
    ],
  },
  {
    id: "regla",
    icon: ListChecks,
    title: "La regla 50/30/20, explicada de verdad",
    summary: "Un punto de partida simple cuando no sabes por dónde empezar.",
    points: [
      "50% necesidades, 30% gustos y 20% ahorro, calculado sobre tu ingreso neto (lo que te queda después de descuentos).",
      "Si tus necesidades pasan del 50%, el ajuste grande casi siempre está en vivienda y transporte, no en el mercado.",
      "Es una guía, no un dogma: 60/20/20 es perfectamente válido si el arriendo de tu ciudad es alto.",
      "Revisa la mezcla cada tres meses o cada vez que cambie tu ingreso; un presupuesto viejo deja de describir tu vida.",
    ],
  },
  {
    id: "presupuesto",
    icon: BookOpen,
    title: "Un presupuesto que sobrevive al mes 2",
    summary: "La mayoría falla por optimista, no por indisciplina.",
    points: [
      "Presupuesta con tu promedio real de los últimos tres meses, no con tu mejor intención.",
      "Incluye una categoría de imprevistos del 5%. Sin ella, cualquier sorpresa rompe el plan completo.",
      "Divide los gastos anuales (matrículas, seguros, impuestos) entre 12 y sepáralos cada mes.",
      "Revísalo cinco minutos una vez por semana. Hacerlo solo a fin de mes es enterarte tarde.",
      "Si te pasaste en una categoría, muévele presupuesto a otra en vez de abandonarlo. Ajustar no es fracasar.",
    ],
  },
  {
    id: "credito",
    icon: CreditCard,
    title: "Qué mirar antes de pedir un crédito",
    summary: "La cuota baja suele esconder el costo alto.",
    points: [
      "Compara la tasa efectiva anual (E.A.), que es la única cifra comparable entre entidades.",
      "Calcula el costo total: cuota × número de cuotas. Ahí ves cuánto pagas de más por encima del valor prestado.",
      "Regla práctica: la suma de todas tus cuotas no debería superar el 30% de tu ingreso mensual.",
      "Pregunta por el costo de prepago; abonar a capital antes de tiempo debería poder hacerse sin penalidad.",
      "Ojo con los seguros y cuotas de manejo asociados: suman al costo real y rara vez aparecen en la publicidad.",
    ],
  },
];

export default function LandingGuides() {
  const [openId, setOpenId] = useState<string | null>(guides[0].id);

  return (
    <div className="mt-12 space-y-3">
      {guides.map(({ id, icon: Icon, title, summary, points }) => {
        const open = openId === id;
        return (
          <div
            key={id}
            className={cn(
              "overflow-hidden rounded-2xl border bg-white transition-colors",
              open
                ? "border-mint/50 shadow-lg shadow-mint/10"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : id)}
                aria-expanded={open}
                aria-controls={`guia-${id}`}
                className="flex w-full items-center gap-4 p-5 text-left"
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                    open
                      ? "bg-mint text-white"
                      : "bg-mint/10 text-mint-dim",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-[#0a1628]">
                    {title}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {summary}
                  </span>
                </span>
                <span
                  className={cn(
                    "relative flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                    open
                      ? "border-mint/40 bg-mint/10 text-mint-dim"
                      : "border-slate-200 text-slate-400",
                  )}
                  aria-hidden
                >
                  <span className="absolute h-0.5 w-3.5 rounded-full bg-current" />
                  <span
                    className={cn(
                      "absolute h-3.5 w-0.5 rounded-full bg-current transition-transform duration-300",
                      open ? "scale-y-0" : "scale-y-100",
                    )}
                  />
                </span>
              </button>
            </h3>

            <div
              id={`guia-${id}`}
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <ul className="space-y-3 border-t border-slate-100 px-5 py-5 sm:pl-20">
                  {points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-3 text-sm leading-relaxed text-slate-600"
                    >
                      <span
                        className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-mint"
                        aria-hidden
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
