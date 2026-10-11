import {
  Car,
  CreditCard,
  Droplet,
  Dumbbell,
  Flame,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Music,
  Receipt,
  ShieldCheck,
  Smartphone,
  Tv,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransferTemplate } from "../types/transfer.types";

type ServiceKind = { icon: LucideIcon; tint: string; keywords: string[] };

/** El primer grupo cuyas palabras aparezcan en el nombre o el destinatario define el ícono. */
const SERVICE_KINDS: ServiceKind[] = [
  { icon: House, tint: "bg-sky-50 text-sky-600", keywords: ["arriendo", "alquiler", "renta", "administracion", "inmobiliaria", "hogar", "casa", "apartamento"] },
  { icon: Wifi, tint: "bg-violet-50 text-violet-600", keywords: ["internet", "wifi", "fibra", "claro", "movistar", "etb", "tigo", "une"] },
  { icon: Smartphone, tint: "bg-indigo-50 text-indigo-600", keywords: ["celular", "telefono", "movil", "plan de datos"] },
  { icon: Zap, tint: "bg-amber-50 text-amber-600", keywords: ["luz", "energia", "electricidad", "enel", "codensa", "epm"] },
  { icon: Droplet, tint: "bg-cyan-50 text-cyan-600", keywords: ["agua", "acueducto", "alcantarillado"] },
  { icon: Flame, tint: "bg-orange-50 text-orange-600", keywords: ["gas", "vanti"] },
  { icon: Tv, tint: "bg-rose-50 text-rose-600", keywords: ["netflix", "disney", "hbo", "max", "prime", "television", "tv", "streaming", "directv"] },
  { icon: Music, tint: "bg-fuchsia-50 text-fuchsia-600", keywords: ["spotify", "music", "musica", "deezer", "youtube"] },
  { icon: Dumbbell, tint: "bg-lime-50 text-lime-700", keywords: ["gimnasio", "gym", "smart fit", "bodytech"] },
  { icon: ShieldCheck, tint: "bg-teal-50 text-teal-600", keywords: ["seguro", "poliza", "soat"] },
  { icon: HeartPulse, tint: "bg-red-50 text-red-600", keywords: ["salud", "eps", "medic", "prepagada", "odontolog"] },
  { icon: GraduationCap, tint: "bg-blue-50 text-blue-600", keywords: ["colegio", "universidad", "matricula", "curso", "educacion", "pension escolar"] },
  { icon: Car, tint: "bg-slate-100 text-slate-600", keywords: ["carro", "vehiculo", "moto", "parqueadero", "gasolina"] },
  { icon: CreditCard, tint: "bg-emerald-50 text-emerald-600", keywords: ["tarjeta", "visa", "mastercard"] },
  { icon: Landmark, tint: "bg-mint/10 text-mint-dim", keywords: ["credito", "prestamo", "hipoteca", "cuota", "banco", "leasing", "credifamilia", "fondo"] },
];

const FALLBACK: Pick<ServiceKind, "icon" | "tint"> = {
  icon: Receipt,
  tint: "bg-mint/10 text-mint-dim",
};

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function hasKeyword(text: string, keyword: string): boolean {
  // Palabras cortas ("tv", "une", "gas") solo como palabra completa.
  if (keyword.length <= 3) return new RegExp(`\\b${keyword}\\b`).test(text);
  return text.includes(keyword);
}

export function getServiceKind(
  template: Pick<TransferTemplate, "name" | "payeeName">
): Pick<ServiceKind, "icon" | "tint"> {
  const text = normalize(`${template.name} ${template.payeeName}`);
  return (
    SERVICE_KINDS.find((kind) => kind.keywords.some((k) => hasKeyword(text, k))) ??
    FALLBACK
  );
}

export default function ServiceAvatar({
  template,
  size = "md",
  className,
}: {
  template: Pick<TransferTemplate, "name" | "payeeName">;
  size?: "md" | "lg";
  className?: string;
}) {
  const { icon: Icon, tint } = getServiceKind(template);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        size === "lg" ? "h-12 w-12" : "h-10 w-10",
        tint,
        className
      )}
      aria-hidden
    >
      <Icon className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2} />
    </span>
  );
}
