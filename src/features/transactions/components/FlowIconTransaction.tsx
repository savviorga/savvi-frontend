import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

type FlowType = "ingreso" | "egreso" | "transaccion" | string;

interface FlowIconProps {
  type: FlowType;
}

const FLOW_CONFIG: Record<
  string,
  { icon: React.ElementType; className: string }
> = {
  ingreso: {
    icon: ArrowDownIcon,
    className: "border-accent/50 text-accent bg-accent/10",
  },
  egreso: {
    icon: ArrowUpIcon,
    className: "border-red-400 text-red-700 bg-red-200",
  },
  transaccion: {
    icon: ArrowsRightLeftIcon,
    className: "border-accent/40 text-accent bg-muted",
  },
};

export function FlowIconTransaction({ type }: FlowIconProps) {
  const config = FLOW_CONFIG[type];

  // 🔒 fallback si viene algo desconocido
  if (!config) {
    return (
      <>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 text-accent bg-muted"
          title={String(type)}
        >
          <QuestionMarkCircleIcon className="h-4 w-4" />
        </div>
      </>
    );
  }

  const { icon: Icon, className } = config;

  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full border ${className}`}
      title={type}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}
