import Link from "next/link";
import { Star } from "lucide-react";

const columns = [
  {
    title: "Producto",
    links: [
      { href: "#funciones", label: "Funciones" },
      { href: "#calculadora", label: "Calculadora 50/30/20" },
      { href: "#preguntas", label: "Preguntas frecuentes" },
    ],
  },
  {
    title: "Aprende gratis",
    links: [
      { href: "#guias", label: "Fondo de emergencia" },
      { href: "#guias", label: "Cómo salir de deudas" },
      { href: "#guias", label: "Gastos hormiga" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/register", label: "Crear cuenta gratis" },
      { href: "/login", label: "Iniciar sesión" },
      { href: "/terminos", label: "Términos y privacidad" },
    ],
  },
] as const;

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 px-5 py-14 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mint shadow-[0_6px_18px_-6px_rgba(0,212,170,0.9)]">
                <Star
                  className="size-[18px] fill-[#011627] text-[#011627]"
                  strokeWidth={0}
                  aria-hidden
                />
              </span>
              <span className="text-lg font-bold tracking-tight text-[#0a1628]">Savvi</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500">
              Finanzas personales claras: registra, presupuesta y entiende a
              dónde se va tu dinero.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mint-dim">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-sm text-slate-500 transition-colors hover:text-mint-dim"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-slate-500 transition-colors hover:text-mint-dim"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Savvi. Todos los derechos reservados.
          </p>
          <p className="max-w-lg text-xs leading-relaxed text-slate-400">
            El contenido educativo de esta página es informativo y no constituye
            asesoría financiera, tributaria ni legal.
          </p>
        </div>
      </div>
    </footer>
  );
}
