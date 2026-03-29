"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import {
  ArrowsRightLeftIcon,
  ClockIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/features/auth/hooks/useAuth";

const navLinks = [
  {
    href: "/transferencias",
    label: "Transferencias",
    icon: ArrowsRightLeftIcon,
  },
  {
    href: "/budget",
    label: "Presupuesto",
    icon: ClockIcon,
  },
  {
    href: "/transactions",
    label: "Transacciones",
    icon: PresentationChartLineIcon,
  },
] as const;

interface HeaderProps {
  /** Sin franja superior: la usa el shell (sidebar + columna principal) */
  embedded?: boolean;
}

export default function Header({ embedded = false }: HeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full ${embedded ? "shrink-0" : ""}`}
    >
      {!embedded && (
        <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
      )}

      <div className="border-b border-slate-200/80 bg-white">
        <div
          className={`mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-6 lg:px-8 ${embedded ? "max-w-none" : ""}`}
        >
          {!isAuthenticated ? (
            <Link href="/" className="group flex shrink-0 items-center gap-4">
              <div className="relative flex h-11 w-11 items-center">
                <Wallet className="h-6 w-6 text-gray-900" strokeWidth={2} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Savvi
              </span>
            </Link>
          ) : (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-6">
                <div className="flex shrink-0 items-center md:hidden">
                  <Link
                    href="/"
                    className="flex items-center gap-2.5 rounded-xl py-1 pr-2 transition-colors hover:bg-slate-100/80"
                  >
                    <Wallet
                      className="h-6 w-6 shrink-0 text-slate-900"
                      strokeWidth={2}
                    />
                    <span className="text-lg font-bold tracking-tight text-slate-900">
                      Savvi
                    </span>
                  </Link>
                </div>

                <nav className="hidden min-w-0 items-center gap-1 md:flex">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive =
                      pathname === link.href ||
                      pathname.startsWith(`${link.href}/`);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-mint/12 text-mint"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 ${
                            isActive ? "text-mint" : "text-slate-500"
                          }`}
                          aria-hidden
                        />
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-offset-2"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 via-emerald-500 to-blue-500 text-sm font-bold text-white shadow-sm">
                    {initials}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.name ?? "Usuario"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user?.email ?? ""}
                      </p>
                    </div>
                    <div className="border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                          />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Iniciar sesión
              </Link>
              {/*<Link
                href="/register"
                className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Registrarse
              </Link> */}
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <nav className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 bg-white px-4 py-3 md:hidden">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-mint/12 text-mint"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-mint" : "text-slate-500"}`}
                  aria-hidden
                />
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
