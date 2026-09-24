"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Faq {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const faqs: Faq[] = [
  {
    id: "precio",
    question: "¿Cuánto cuesta Savvi?",
    answer: (
      <>
        Puedes crear tu cuenta y empezar a usar Savvi sin costo y sin tarjeta de
        crédito. Si en el futuro aparecen funciones de pago, seguirás pudiendo
        usar lo que ya tienes.
      </>
    ),
  },
  {
    id: "dinero",
    question: "¿Savvi guarda o mueve mi dinero?",
    answer: (
      <>
        No. Savvi es una herramienta de registro y análisis: no custodia dinero,
        no ejecuta pagos ni transferencias reales y no intermedia operaciones. Lo
        que ves son los movimientos que tú registras.
      </>
    ),
  },
  {
    id: "banco",
    question: "¿Se conecta con mi banco?",
    answer: (
      <>
        Hoy no hay conexión automática con entidades bancarias. Registras tus
        movimientos a mano —toma segundos— o se los dictas a Savvi IA en lenguaje
        natural y confirmas la propuesta.
      </>
    ),
  },
  {
    id: "seguridad",
    question: "¿Qué tan segura está mi información?",
    answer: (
      <>
        Tu cuenta está protegida con contraseña y tus datos viajan y se almacenan
        cifrados. Nadie más que tú consulta tus movimientos. Los detalles están en
        los{" "}
        <Link
          href="/terminos#privacidad"
          className="font-medium text-mint-dim underline underline-offset-4 hover:text-mint"
        >
          términos y el tratamiento de datos
        </Link>
        .
      </>
    ),
  },
  {
    id: "ia",
    question: "¿Qué hace exactamente Savvi IA?",
    answer: (
      <>
        Interpreta lo que escribes —“pagué 120 mil de luz”— y propone el
        movimiento con monto, categoría y cuenta. La propuesta siempre pasa por tu
        confirmación antes de guardarse, así que tú tienes la última palabra.
      </>
    ),
  },
  {
    id: "movil",
    question: "¿Funciona en el celular?",
    answer: (
      <>
        Sí. Savvi se adapta a la pantalla del teléfono desde el navegador, sin
        instalar nada. Es la forma más cómoda de registrar un gasto en el momento
        en que ocurre.
      </>
    ),
  },
  {
    id: "borrar",
    question: "¿Puedo eliminar mi cuenta y mis datos?",
    answer: (
      <>
        Cuando quieras. Al eliminar tu cuenta se borran tus registros
        financieros, salvo lo que la ley obligue a conservar.
      </>
    ),
  },
  {
    id: "experiencia",
    question: "¿Necesito saber de finanzas para usarlo?",
    answer: (
      <>
        No. Savvi está pensado para quien nunca ha llevado un presupuesto: empiezas
        registrando lo que gastas y las categorías y reportes se van armando solos.
      </>
    ),
  },
];

export default function LandingFaq() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
      {faqs.map(({ id, question, answer }) => {
        const open = openId === id;
        return (
          <div key={id}>
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : id)}
                aria-expanded={open}
                aria-controls={`faq-${id}`}
                className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-mint-dim"
              >
                <span className="text-base font-semibold text-[#0a1628]">
                  {question}
                </span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-slate-400 transition-transform duration-300",
                    open && "rotate-180 text-mint-dim",
                  )}
                  aria-hidden
                />
              </button>
            </h3>
            <div
              id={`faq-${id}`}
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-5 pr-8 text-sm leading-relaxed text-slate-600">
                  {answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
