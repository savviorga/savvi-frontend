"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import SideBarMenu from "./SideBarMenu";

const AUTH_ONLY_ROUTES_HIDE_SIDEBAR = ["/login", "/register"];

/**
 * Envuelve el contenido con el menú lateral cuando hay sesión.
 * El Header no se modifica; vive en el layout raíz.
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
    return <>{children}</>;
  }

  return (
    <div className="flex w-full min-h-[calc(100vh-75px)]">
      <SideBarMenu />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
