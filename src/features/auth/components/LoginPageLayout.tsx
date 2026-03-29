"use client";

import LoginBrandingPanel from "./LoginBrandingPanel";

interface LoginPageLayoutProps {
  children: React.ReactNode;
}

/**
 * Vista login: mobile-first (columna marca → formulario), desktop dos columnas.
 */
export default function LoginPageLayout({ children }: LoginPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:min-h-screen lg:flex-row">
      <aside className="w-full shrink-0 lg:flex lg:w-[min(44%,28rem)] lg:max-w-none lg:flex-col">
        <LoginBrandingPanel />
      </aside>
      <div className="flex min-h-0 flex-1 flex-col justify-center bg-white px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14 xl:px-16">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
