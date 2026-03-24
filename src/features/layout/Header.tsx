"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

const navLinks = [
    {
        href: "/transferencias",
        label: "Transferencias",
        icon: (
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h9m-9 4.5h9m-9 4.5H12m-8.25 4.5h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0019.5 3H3A2.25 2.25 0 00.75 5.25v16.5A2.25 2.25 0 003 24h16.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V3" opacity="0" />
            </svg>
        ),
    },
    {
        href: "/budget",
        label: "Presupuesto",
        icon: (
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.6 1M12 8V6m0 0V4m0 2c-1.11 0-2.08.402-2.6 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
