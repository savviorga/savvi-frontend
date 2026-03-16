import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          {/* Badge */}
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-100">
            Finanzas personales inteligentes
          </span>

          {/* Headline */}
          <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Toma control total de
            <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              tu dinero
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            Registra ingresos, controla gastos, organiza categorías y entiende
            claramente en qué se va tu dinero. Todo en un solo lugar, simple y seguro.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row flex-wrap">
            <Link
              href="/transactions"
              className="
        inline-flex items-center justify-center rounded-xl
        bg-indigo-600 px-6 py-3 text-sm font-semibold text-white
        shadow-lg shadow-indigo-600/20
        transition hover:bg-indigo-700 hover:shadow-indigo-600/30
        active:scale-[0.98]
      "
            >
              Empezar ahora
            </Link>

            <Link
              href="/register"
              className="
        inline-flex items-center justify-center rounded-xl
        bg-indigo-500 px-6 py-3 text-sm font-semibold text-white
        shadow-md transition hover:bg-indigo-600 active:scale-[0.98]
      "
            >
              Registrarse
            </Link>

            <Link
              href="/login"
              className="
        inline-flex items-center justify-center rounded-xl
        border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900
        shadow-sm transition
        hover:bg-gray-50 hover:shadow
        active:scale-[0.98]
        dark:border-gray-700 dark:bg-gray-900 dark:text-white
      "
            >
              Iniciar sesión
            </Link>

            <Link
              href="/categories"
              className="
        inline-flex items-center justify-center rounded-xl
        border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900
        shadow-sm transition
        hover:bg-gray-50 hover:shadow
        active:scale-[0.98]
        dark:border-gray-700 dark:bg-gray-900 dark:text-white
      "
            >
              Organizar categorías
            </Link>
          </div>

          {/* Trust / Features */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Control claro
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Visualiza fácilmente ingresos, egresos y balances mensuales.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Organización inteligente
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Categoriza gastos y detecta oportunidades de ahorro.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Decisiones informadas
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Entiende tu dinero para tomar mejores decisiones financieras.
              </p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
