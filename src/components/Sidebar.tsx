"use client";

import React from "react";
import Link from "next/link";
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    TagIcon,
    CurrencyDollarIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
    const [isOpen, setIsOpen] = React.useState(true);

    const navigation = [
        { name: "Home", href: "/", icon: HomeIcon },
        { name: "Categories", href: "/categories", icon: TagIcon },
        { name: "Expenses", href: "/expenses", icon: CurrencyDollarIcon },
        { name: "Transactions", href: "/transactions", icon: ArrowRightOnRectangleIcon },
        { name: "Incomes", href: "/incomes", icon: CurrencyDollarIcon },
        { name: "Accounts", href: "/accounts", icon: CurrencyDollarIcon },
    ];

    return (
        <>
            {/* Toggle button (visible en todas las resoluciones) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-5 left-5 z-50 bg-white/90 backdrop-blur border border-gray-200 shadow-lg rounded-xl p-2 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label="Open sidebar"
                >
                    <Bars3Icon className="h-6 w-6 text-blue-600" />
                </button>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg flex flex-col p-6 z-40 transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                {/* Brand */}
                <div>
                    <div className="text-2xl font-bold text-blue-600 mb-10">Savvi</div>
                    <div>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="fixed top-5 left-50 z-50 bg-white/90 backdrop-blur border border-gray-200 shadow-lg rounded-xl p-2 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            aria-label="Toggle sidebar"
                        >
                            {isOpen ? (
                                <XMarkIcon className="h-6 w-6 text-blue-600" />
                            ) : (
                                <Bars3Icon className="h-6 w-6 text-blue-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-3 flex-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsOpen(false)} // cierra también al navegar
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Footer (settings, logout, etc.) */}
                <div className="mt-6 border-t pt-4">
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Cog6ToothIcon className="h-5 w-5" />
                        Settings
                    </Link>
                    <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition w-full text-left">
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
