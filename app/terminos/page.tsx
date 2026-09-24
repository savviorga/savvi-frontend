import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Mail, ShieldCheck, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y condiciones | Savvi",
  description:
    "Términos y condiciones de uso y tratamiento de datos de Savvi, la app para gestionar tus finanzas personales.",
};

const LAST_UPDATE = "20 de septiembre de 2026";

/**
 * Los datos que dependen de la constitución legal de Savvi van entre [[dobles
 * corchetes]]: se resaltan en la página para que sea evidente qué falta completar.
 */
type Block = string | string[];

interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

const sections: Section[] = [
  {
    id: "aceptacion",
    title: "1. Aceptación de los términos",
    blocks: [
      "Estos términos y condiciones regulan el acceso y uso de Savvi (la “Plataforma”), un servicio operado por [[razón social]], con domicilio en [[ciudad, país]]. Al crear una cuenta, marcar la casilla de aceptación o usar la Plataforma, declaras que leíste, entendiste y aceptas estos términos en su totalidad.",
      "Si no estás de acuerdo con alguna parte, no debes crear una cuenta ni utilizar el servicio.",
    ],
  },
  {
    id: "servicio",
    title: "2. Qué es Savvi",
    blocks: [
      "Savvi es una herramienta de organización de finanzas personales que te permite, entre otras funciones:",
      [
        "registrar ingresos, egresos y transferencias entre tus cuentas;",
        "clasificar movimientos por categorías y presupuestos;",
        "programar pagos recurrentes y recordatorios;",
        "consultar reportes y análisis sobre tus propios registros.",
      ],
      "Savvi no es una entidad financiera, no custodia dinero, no ejecuta pagos ni transferencias reales y no intermedia operaciones con terceros. Todo lo que ves en la Plataforma es un registro informativo creado por ti o importado por ti.",
    ],
  },
  {
    id: "cuenta",
    title: "3. Tu cuenta",
    blocks: [
      "Para usar Savvi debes crear una cuenta con datos veraces y mantenerlos actualizados. Debes ser mayor de edad según la legislación de [[ciudad, país]] o contar con autorización de tu representante legal.",
      "Eres responsable de la confidencialidad de tu contraseña y de toda la actividad que ocurra en tu cuenta. Si detectas un acceso no autorizado, notifícalo de inmediato a [[correo de contacto]].",
      "Cada cuenta es personal e intransferible. No debes compartir tus credenciales ni permitir que terceros operen en tu nombre.",
    ],
  },
  {
    id: "uso",
    title: "4. Uso permitido",
    blocks: [
      "Te comprometes a usar Savvi conforme a la ley y a estos términos. En particular, no está permitido:",
      [
        "usar la Plataforma para actividades ilícitas, fraudulentas o de lavado de activos;",
        "intentar acceder a cuentas, datos o sistemas que no te pertenezcan;",
        "interferir con el funcionamiento del servicio, vulnerar sus medidas de seguridad o realizar ingeniería inversa;",
        "extraer datos de forma automatizada o masiva sin autorización escrita;",
        "revender, sublicenciar o explotar comercialmente el servicio sin autorización.",
      ],
      "El incumplimiento de esta sección puede derivar en la suspensión o cancelación inmediata de tu cuenta.",
    ],
  },
  {
    id: "privacidad",
    title: "5. Tratamiento de datos y privacidad",
    blocks: [
      "Al registrarte autorizas a [[razón social]] a tratar tus datos personales —nombre, correo electrónico y la información financiera que tú registres— con la finalidad exclusiva de prestarte el servicio: autenticarte, guardar tus movimientos, generar reportes y enviarte comunicaciones operativas sobre tu cuenta.",
      "La información se almacena cifrada y el acceso está restringido al personal que lo requiere para operar la Plataforma. No vendemos ni cedemos tus datos financieros a terceros con fines publicitarios.",
      "Como titular de los datos puedes conocer, actualizar, rectificar o solicitar la supresión de tu información, así como revocar esta autorización, escribiendo a [[correo de contacto]]. El tratamiento se rige por la normativa de protección de datos aplicable en [[ciudad, país]] ([[norma de protección de datos aplicable]]).",
      "Al eliminar tu cuenta se eliminan tus registros financieros, salvo la información que debamos conservar por obligación legal o para la defensa de reclamaciones.",
    ],
  },
  {
    id: "ia",
    title: "6. Funciones asistidas por inteligencia artificial",
    blocks: [
      "Algunas funciones de Savvi usan modelos de inteligencia artificial para interpretar textos o documentos que tú envías y proponer el registro de transacciones, categorías o presupuestos.",
      "Estas sugerencias son automáticas y pueden contener errores: siempre debes revisarlas y confirmarlas antes de guardarlas. Savvi no se hace responsable por registros incorrectos que hayas confirmado.",
    ],
  },
  {
    id: "asesoria",
    title: "7. Savvi no presta asesoría financiera",
    blocks: [
      "Los reportes, proyecciones, alertas y recomendaciones que muestra la Plataforma tienen carácter meramente informativo y educativo. No constituyen asesoría financiera, tributaria, contable ni legal, ni una recomendación de inversión.",
      "Las decisiones que tomes sobre tu dinero son exclusivamente tuyas. Si necesitas asesoría profesional, consulta a un especialista autorizado.",
    ],
  },
  {
    id: "disponibilidad",
    title: "8. Disponibilidad del servicio",
    blocks: [
      "Trabajamos para mantener Savvi disponible de forma continua, pero el servicio se presta “tal cual” y puede sufrir interrupciones por mantenimiento, fallas técnicas o causas ajenas a nuestro control.",
      "Podemos modificar, suspender o descontinuar funcionalidades en cualquier momento. Si un cambio afecta de forma relevante el servicio, te lo informaremos con antelación razonable por correo electrónico o dentro de la aplicación.",
    ],
  },
  {
    id: "propiedad",
    title: "9. Propiedad intelectual",
    blocks: [
      "El software, la marca Savvi, el diseño, los textos y demás elementos de la Plataforma son propiedad de [[razón social]] o de sus licenciantes, y están protegidos por la normativa de propiedad intelectual.",
      "La información financiera que registras es y sigue siendo tuya. Nos otorgas únicamente la licencia necesaria para almacenarla y procesarla con el fin de prestarte el servicio.",
    ],
  },
  {
    id: "terminacion",
    title: "10. Terminación",
    blocks: [
      "Puedes cerrar tu cuenta cuando quieras desde la aplicación o escribiendo a [[correo de contacto]].",
      "Podemos suspender o cancelar tu cuenta si incumples estos términos, si detectamos un uso fraudulento o si una autoridad competente lo ordena. Cuando sea razonablemente posible, te avisaremos antes de hacerlo.",
    ],
  },
  {
    id: "responsabilidad",
    title: "11. Limitación de responsabilidad",
    blocks: [
      "En la máxima medida permitida por la ley aplicable, Savvi no responde por lucro cesante, pérdida de oportunidades ni daños indirectos derivados del uso o la imposibilidad de uso de la Plataforma, ni por decisiones financieras tomadas con base en la información allí registrada.",
      "Nada en estos términos excluye la responsabilidad que no pueda limitarse legalmente, como el dolo o la culpa grave.",
    ],
  },
  {
    id: "cambios",
    title: "12. Cambios en estos términos",
    blocks: [
      "Podemos actualizar estos términos para reflejar cambios legales o nuevas funcionalidades. Publicaremos la versión vigente en esta página con su fecha de actualización y, si los cambios son sustanciales, te lo notificaremos por correo o dentro de la aplicación.",
      "Si continúas usando Savvi después de la entrada en vigor de una nueva versión, se entenderá que la aceptas.",
    ],
  },
  {
    id: "contacto",
    title: "13. Ley aplicable y contacto",
    blocks: [
      "Estos términos se rigen por las leyes de [[ciudad, país]]. Cualquier controversia se someterá a los jueces y tribunales competentes de esa jurisdicción.",
      "Para cualquier consulta sobre estos términos o sobre el tratamiento de tus datos, escríbenos a [[correo de contacto]].",
    ],
  },
];

/** Resalta los [[datos pendientes]] dentro de un párrafo. */
function Prose({ text }: { text: string }) {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("[[") && part.endsWith("]]") ? (
          <mark
            key={index}
            title="Dato pendiente de completar"
            className="rounded bg-amber-100 px-1 font-medium text-amber-800"
          >
            {part.slice(2, -2)}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#011627] px-5 py-10 text-white sm:px-8 sm:py-14">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <Link
            href="/register"
            className="inline-flex w-fit items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Volver al registro
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-mint shadow-[0_0_0_1px_rgba(0,210,160,0.35)]">
              <Star
                className="size-[22px] fill-[#011627] text-[#011627]"
                strokeWidth={0}
                aria-hidden
              />
            </div>
            <span className="text-xl font-bold tracking-tight">Savvi</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">
              Legal
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Términos y condiciones
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Las reglas de uso de Savvi y cómo tratamos la información que
              registras en la aplicación.
            </p>
            <p className="text-xs text-slate-500">
              Última actualización: {LAST_UPDATE}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <nav
          aria-label="Contenido"
          className="mb-10 rounded-xl border border-slate-200 bg-slate-50/70 p-5"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Contenido
          </p>
          <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-slate-600 underline-offset-4 transition-colors hover:text-mint-dim hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-8 space-y-3"
            >
              <h2 className="text-lg font-bold tracking-tight text-[#0a1628] sm:text-xl">
                {section.title}
              </h2>
              {section.blocks.map((block, index) =>
                Array.isArray(block) ? (
                  <ul key={index} className="space-y-2 pl-1">
                    {block.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2.5 text-sm leading-relaxed text-slate-600"
                      >
                        <span
                          className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-mint"
                          aria-hidden
                        />
                        <span>
                          <Prose text={item} />
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    key={index}
                    className="text-sm leading-relaxed text-slate-600"
                  >
                    <Prose text={block} />
                  </p>
                ),
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
            <Mail className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
            <span>
              ¿Dudas sobre estos términos? Escríbenos a{" "}
              <mark
                title="Dato pendiente de completar"
                className="rounded bg-amber-100 px-1 font-medium text-amber-800"
              >
                correo de contacto
              </mark>
              .
            </span>
          </p>
          <Link
            href="/register"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/30"
          >
            Crear mi cuenta
          </Link>
        </div>

        <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-slate-400">
          <ShieldCheck
            className="mt-0.5 size-3.5 shrink-0 text-slate-400"
            aria-hidden
          />
          <span>
            Tu información financiera se almacena cifrada y solo tú puedes
            consultarla desde tu cuenta.
          </span>
        </p>
      </main>
    </div>
  );
}
