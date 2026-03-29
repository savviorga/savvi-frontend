"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import Header from "@/features/layout/Header";
import SideBarMenu from "./SideBarMenu";

const AUTH_ONLY_ROUTES_HIDE_SIDEBAR = ["/login", "/register"];

/**
 * Con sesión: fila [aside min-h-screen | franja + header + contenido].
 * Sin sesión o páginas auth: solo header global y children.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  const isPublicAuthPage = AUTH_ONLY_ROUTES_HIDE_SIDEBAR.some(
    (p) => pathname === p
  );

  const showSidebar =
    !loading && isAuthenticated && !isPublicAuthPage;

  if (!showSidebar) {
    if (isPublicAuthPage) {
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
