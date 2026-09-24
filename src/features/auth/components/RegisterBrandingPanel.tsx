"use client";

import { CreditCard, ShieldCheck, Zap } from "lucide-react";
import LoginBrandingPanel, { type BrandingFeature } from "./LoginBrandingPanel";

const features: readonly BrandingFeature[] = [
  {
    icon: Zap,
    label: "Listo en menos de un minuto",
  },
  {
    icon: ShieldCheck,
    label: "Tus datos cifrados y privados",
  },
  {
    icon: CreditCard,
    label: "Gratis, sin tarjeta de crédito",
  },
] as const;

/** Mismo panel de marca del login, con el mensaje de alta de cuenta. */
export default function RegisterBrandingPanel() {
  return (
    <LoginBrandingPanel
      eyebrow="Crea tu cuenta gratis"
      title={
        <>
          Empieza hoy a <span className="text-mint">tomar el control.</span>
        </>
      }
      description="Crea tu cuenta y registra ingresos, egresos y presupuestos desde el primer día."
      features={features}
    />
  );
}
