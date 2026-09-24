"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import Header from "@/features/layout/Header";
import SideBarMenu from "./SideBarMenu";

/** Páginas con su propio encabezado: se renderizan sin header ni sidebar globales. */
const STANDALONE_ROUTES = ["/", "/login", "/register", "/list", "/terminos"];

/**
 * Con sesión: fila [aside min-h-screen | franja + header + contenido].
 * Sin sesión: header global y children. Rutas standalone: solo children.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  const isStandalonePage = STANDALONE_ROUTES.some((p) => pathname === p);

  const showSidebar =
    !loading && isAuthenticated && !isStandalonePage;

  if (!showSidebar) {
    if (isStandalonePage) {
      return <>{children}</>;
    }
    return (
      <>
        <Header />
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <SideBarMenu />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div
          className="h-[3px] shrink-0 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"
          aria-hidden
        />
        <Header embedded />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
