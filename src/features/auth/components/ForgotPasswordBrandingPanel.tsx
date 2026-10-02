"use client";

import { Clock, KeyRound, MailCheck } from "lucide-react";
import LoginBrandingPanel, { type BrandingFeature } from "./LoginBrandingPanel";

const features: readonly BrandingFeature[] = [
  {
    icon: MailCheck,
    label: "Código de 6 dígitos en tu correo",
  },
  {
    icon: Clock,
    label: "Válido por 15 minutos",
  },
  {
    icon: KeyRound,
    label: "Crea una nueva contraseña y vuelve a entrar",
  },
] as const;

/** Mismo panel de marca del login, con el mensaje de recuperación. */
export default function ForgotPasswordBrandingPanel() {
  return (
    <LoginBrandingPanel
      eyebrow="Recupera tu acceso"
      title={
        <>
          Vuelve a tu cuenta <span className="text-mint">en 3 pasos.</span>
        </>
      }
      description="Te enviamos un código a tu email para confirmar que eres tú y elegir una nueva contraseña."
      features={features}
    />
  );
}
