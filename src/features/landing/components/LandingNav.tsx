"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#funciones", label: "Funciones" },
  { href: "#calculadora", label: "Calculadora" },
  { href: "#guias", label: "Guías gratis" },
  { href: "#preguntas", label: "Preguntas" },
] as const;

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mint shadow-[0_6px_18px_-6px_rgba(0,212,170,0.9)]">
            <Star
              className="size-[18px] fill-[#011627] text-[#011627]"
              strokeWidth={0}
              aria-hidden
            />
          </span>
          <span className="text-lg font-bold tracking-tight text-[#0a1628]">
            Savvi
          </span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-mint-dim"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0a1628]"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-mint px-4 py-2 text-sm font-bold text-[#011627] shadow-[0_10px_26px_-10px_rgba(0,212,170,0.95)] transition-all hover:bg-mint-dim active:scale-[0.97]"
          >
            Crear cuenta gratis
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          className="flex size-10 items-center justify-center rounded-lg text-[#0a1628] transition-colors hover:bg-slate-100 md:hidden"
        >
          {menuOpen ? (
            <X className="size-5" aria-hidden />
          ) : (
            <Menu className="size-5" aria-hidden />
          )}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-5 pb-6 pt-4 shadow-lg duration-200 animate-in fade-in slide-in-from-top-2 md:hidden">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-mint-dim"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-[#0a1628] transition-colors hover:bg-slate-50"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="flex h-11 items-center justify-center rounded-lg bg-mint text-sm font-bold text-[#011627] transition-colors hover:bg-mint-dim"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
