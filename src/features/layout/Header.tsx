"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

const navLinks = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: (
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
    },
    {
        href: "/planificador",
        label: "Planificador",
        icon: (
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
        ),
    },
    {
        href: "/transactions",
        label: "Transacciones",
        icon: (
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
        ),
    },
    {
        href: "/categories",
        label: "Categorías",
        icon: (
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
        ),
    },
    {
        href: "/accounts",
        label: "Cuentas",
        icon: (
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
        ),
    },
];

export default function Header() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full">
            {/* Premium gradient border */}
            <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

            <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 lg:px-8">

                    {/* Logo Premium */}
                    <Link href="/" className="group flex items-center gap-4">
                        <div className="relative flex h-11 w-11 items-center">
                            <Wallet className="h-6 w-6 text-gray-900" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-slate-900">Savvi</span>
                            <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                                Finanzas Personales
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Premium - solo con sesión */}
                    {isAuthenticated && (
                        <nav className="hidden items-center rounded-full border border-slate-200/80 bg-slate-50/50 p-1.5 md:flex">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`relative flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive
                                                ? "bg-white text-slate-900 shadow-md shadow-slate-200/50"
                                                : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        <span
                                            className={`transition-colors duration-200 ${isActive
                                                    ? "text-emerald-600"
                                                    : "text-slate-400 group-hover:text-slate-500"
                                                }`}
                                        >
                                            {link.icon}
                                        </span>
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}

                    {/* Actions Premium */}
                    <div className="flex items-center gap-2">
                        {/* CTA Nueva transacción - solo con sesión */}
                        {isAuthenticated && (
                            <Link
                                href="/transactions"
                                className="group relative flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]"
                            >
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                                <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span className="relative hidden sm:inline">Nueva transacción</span>
                            </Link>
                        )}

                        {!isAuthenticated ? (
                            <>
                                <Link
                                    href="/login"
                                    className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                >
                                    Registrarse
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="mx-1 h-8 w-px bg-slate-200" />
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="group flex items-center gap-2 rounded-full p-1.5 transition-all duration-200 hover:bg-slate-100"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white ring-2 ring-white shadow-sm transition-all duration-200 group-hover:ring-emerald-200">
                                            {initials}
                                        </div>
                                        <svg
                                            className={`hidden h-4 w-4 text-slate-400 transition-all duration-200 group-hover:text-slate-600 sm:block ${userMenuOpen ? "rotate-180" : ""}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>

                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="border-b border-slate-100 px-3 py-3">
                                                <p className="text-sm font-semibold text-slate-900">{user?.name ?? "Usuario"}</p>
                                                <p className="text-xs text-slate-500">{user?.email ?? ""}</p>
                                            </div>
                                            <div className="border-t border-slate-100 pt-2">
                                                <button
                                                    onClick={() => { setUserMenuOpen(false); logout(); }}
                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                                    </svg>
                                                    Cerrar sesión
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Premium - solo con sesión */}
            {isAuthenticated && (
                <nav className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 bg-white px-4 py-3 md:hidden">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${isActive
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-900 shadow-md shadow-emerald-500/20"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                <span className={isActive ? "text-gray-900/90" : "text-slate-400"}>
                                    {link.icon}
                                </span>
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            )}
        </header>
    );
}
