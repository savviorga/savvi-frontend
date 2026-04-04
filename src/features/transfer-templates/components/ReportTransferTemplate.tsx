"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import type { TransferTemplate } from "@/features/transfer-templates/types/transfer.types";
import type { Transaction } from "@/features/transactions/types/transactions.types";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

type ReportTransferTemplateProps = {
  templates: TransferTemplate[];
  transferTransactions: Transaction[];
};

export default function ReportTransferTemplate({
  templates,
  transferTransactions,
}: ReportTransferTemplateProps) {
  const activeTemplates = templates.filter((t) => t.isActive);
  const totalMoved = transferTransactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  const averageTicket =
    transferTransactions.length > 0 ? totalMoved / transferTransactions.length : 0;

  const monthlySeries = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const tx of transferTransactions) {
      const key = tx.date?.slice(0, 7) ?? "";
      if (!key) continue;
      grouped.set(key, (grouped.get(key) ?? 0) + Number(tx.amount || 0));
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, value]) => ({
        label: format(new Date(`${key}-01`), "MMM yyyy", { locale: es }),
        value,
      }));
  }, [transferTransactions]);

  const frequencyDistribution = useMemo(() => {
    const counts = templates.reduce<Record<string, number>>((acc, template) => {
      acc[template.frequency] = (acc[template.frequency] ?? 0) + 1;
      return acc;
    }, {});

    const labelsMap: Record<string, string> = {
      weekly: "Semanal",
      biweekly: "Quincenal",
      monthly: "Mensual",
      bimonthly: "Bimestral",
      custom: "Personalizada",
    };

    const keys = Object.keys(counts);
    return {
      labels: keys.map((k) => labelsMap[k] ?? k),
      values: keys.map((k) => counts[k]),
    };
  }, [templates]);

  const lineData = {
    labels: monthlySeries.map((item) => item.label),
    datasets: [
      {
        label: "Transferencias por mes",
        data: monthlySeries.map((item) => item.value),
        borderColor: "rgb(0, 196, 154)",
        backgroundColor: "rgba(0, 196, 154, 0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const doughnutData = {
    labels: frequencyDistribution.labels,
    datasets: [
      {
        data: frequencyDistribution.values,
        backgroundColor: [
          "rgba(11, 24, 41, 0.85)",
          "rgba(0, 196, 154, 0.85)",
          "rgba(14, 165, 233, 0.85)",
          "rgba(245, 158, 11, 0.85)",
          "rgba(244, 63, 94, 0.85)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const moneyTick = (value: unknown) => {
    const n = Number(value);
    return formatMoney(Number.isFinite(n) ? n : 0);
  };

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: moneyTick },
      },
    },
  };

  const topTemplate = useMemo(() => {
    const byTemplate = new Map<string, { label: string; total: number }>();
    for (const template of templates) {
      byTemplate.set(template.id, { label: template.name, total: 0 });
    }

    for (const tx of transferTransactions) {
      const description = tx.description ?? "";
      const match = description.match(/transfer_template_id:([a-zA-Z0-9-]+)/);
      const templateId = match?.[1];
      if (!templateId) continue;
      const current = byTemplate.get(templateId);
      if (!current) continue;
      current.total += Number(tx.amount || 0);
      byTemplate.set(templateId, current);
    }

    return Array.from(byTemplate.values()).sort((a, b) => b.total - a.total)[0] ?? null;
  }, [templates, transferTransactions]);

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Plantillas activas</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{activeTemplates.length}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Transferencias registradas</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {transferTransactions.length}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Monto total movido</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{formatMoney(totalMoved)}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Ticket promedio</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatMoney(averageTicket)}
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="h-[320px] rounded-2xl border border-border bg-card p-4 xl:col-span-2">
          <p className="mb-3 text-sm font-medium text-foreground">Evolucion mensual (ultimos 6)</p>
          {monthlySeries.length > 0 ? (
            <Line data={lineData} options={lineOptions} />
          ) : (
            <p className="text-sm text-muted-foreground">No hay datos para la grafica aun.</p>
          )}
        </article>

        <article className="h-[320px] rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Frecuencia de plantillas</p>
          {frequencyDistribution.values.length > 0 ? (
            <Doughnut data={doughnutData} />
          ) : (
            <p className="text-sm text-muted-foreground">No hay plantillas para analizar.</p>
          )}
        </article>
      </div>

      <article className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Analisis rapido</h3>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          <p>
            {activeTemplates.length > 0
              ? `Tienes ${activeTemplates.length} plantillas activas para tus pagos recurrentes.`
              : "Aun no tienes plantillas activas."}
          </p>
          <p>
            {topTemplate && topTemplate.total > 0
              ? `La plantilla con mayor movimiento es "${topTemplate.label}" con ${formatMoney(
                  topTemplate.total
                )}.`
              : "Todavia no hay suficiente historial para detectar la plantilla de mayor movimiento."}
          </p>
        </div>
      </article>
    </section>
  );
}
