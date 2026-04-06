"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SavvyBannerHome, {
  type SavvyBannerHomeStat,
} from "@/components/Banner/SavvyBannerHome";
import CustomTable, { type Column } from "@/components/Table/CustomTable";
import PlannerTabs from "@/components/Tabs/PlannerTabs";
import { Button } from "@/components/ui/shadcn-button";
import { usePaymentPlanner } from "@/features/payment-planner/hooks/usePaymentPlanner";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCategories } from "@/features/categories/hooks/useCategories";
import DebtFormModal from "@/features/payment-planner/components/DebtFormModal";
import RegisterPaymentModal from "@/features/payment-planner/components/RegisterPaymentModal";
import { DollarSign, Pencil, Trash2 } from "lucide-react";
import type {
  Debt,
  CreateDebtDto,
} from "@/features/payment-planner/types/debt.types";
import { differenceInCalendarDays, format, parse, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { ProgressBar } from "@/components/ProgressBar";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/** Ventana en días para la barra de avance al vencimiento (deudas recurrentes / resto). */
function debtPeriodDays(d: Debt): number {
  if (d.isRecurring && d.recurrenceType === "biweekly") return 14;
  if (d.isRecurring && d.recurrenceType === "monthly") return 30;
  return 30;
}

function getDebtDueProgressInfo(d: Debt) {
  const due = startOfDay(parse(d.dueDate, "yyyy-MM-dd", new Date()));
  const today = startOfDay(new Date());
  const daysUntil = differenceInCalendarDays(due, today);
  const periodDays = debtPeriodDays(d);

  let progressPercent: number;
  if (daysUntil <= 0) {
    progressPercent = 100;
  } else {
    progressPercent = Math.min(
      100,
      Math.max(0, (1 - daysUntil / periodDays) * 100),
    );
  }

  let label: string;
  if (daysUntil < 0) {
    const n = Math.abs(daysUntil);
    label = n === 1 ? "Venció hace 1 día" : `Venció hace ${n} días`;
  } else if (daysUntil === 0) {
    label = "Vence hoy";
  } else if (daysUntil === 1) {
    label = "Falta 1 día";
  } else {
    label = `Faltan ${daysUntil} días`;
  }

  return { daysUntil, progressPercent, label };
}

function dueProgressVariant(daysUntil: number) {
  if (daysUntil < 0) return "red" as const;
  if (daysUntil === 3) return "red" as const;
  if (daysUntil <= 5) return "orange" as const;
  return "teal" as const;
}

type TabId = "obligations" | "paid" | "history";

type PaymentHistoryRow = {
  id: string;
  debtName: string;
  amount: number;
  paidAt: string;
};

export default function PlanificadorPage() {
  const [tab, setTab] = useState<TabId>("obligations");
  const [formOpen, setFormOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [registerPaymentDebt, setRegisterPaymentDebt] = useState<Debt | null>(
    null,
  );
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] =
    useState<string>("");

  const { debts, totalPaid, loading, create, update, remove, registerPayment } =
    usePaymentPlanner();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  useEffect(() => {
    if (!selectedPaymentAccountId && accounts.length > 0) {
      setSelectedPaymentAccountId(accounts[0].id);
    }
  }, [accounts, selectedPaymentAccountId]);

  const pendingDebts = debts.filter((d) => d.status === "pending");
  const paidDebts = debts.filter((d) => d.status === "paid");
  const totalPending = pendingDebts.reduce(
    (sum, d) => sum + Number(d.remainingAmount),
    0,
  );

  /** Solo pendientes — pestaña Obligaciones */
  const sortedPendingDebts = useMemo(() => {
    return debts
      .filter((d) => d.status === "pending")
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
  }, [debts]);

  /** Solo pagadas — pestaña Pagadas */
  const sortedPaidDebts = useMemo(() => {
    return debts
      .filter((d) => d.status === "paid")
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
  }, [debts]);

  const paymentHistoryRows = useMemo(() => {
    const rows: PaymentHistoryRow[] = [];
    for (const d of debts) {
      for (const p of d.payments ?? []) {
        rows.push({
          id: p.id,
          debtName: d.name,
          amount: Number(p.amount),
          paidAt: p.paidAt,
        });
      }
    }
    rows.sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );
    return rows;
  }, [debts]);

  const plannerTabs = useMemo(
    () => [
      { id: "obligations" as const, label: "Obligaciones", count: pendingDebts.length },
      { id: "paid" as const, label: "Pagadas", count: paidDebts.length },
      {
        id: "history" as const,
        label: "Historial de pagos",
        count: paymentHistoryRows.length,
      },
    ],
    [pendingDebts.length, paidDebts.length, paymentHistoryRows.length],
  );

  const plannerBannerStats: SavvyBannerHomeStat[] = useMemo(
    () => [
      {
        label: "Pendiente por pagar",
        value: formatMoney(totalPending),
        hint: `${pendingDebts.length} obligación(es)`,
        valueTone: "rose",
      },
      {
        label: "Total pagado",
        value: formatMoney(totalPaid),
        hint: "Historial acumulado",
        valueTone: "mint",
      },
      {
        label: "Obligaciones",
        value: String(debts.length),
        hint: `${pendingDebts.length} pendientes, ${paidDebts.length} pagadas`,
        valueTone: "navy",
      },
    ],
    [
      totalPending,
      pendingDebts.length,
      totalPaid,
      debts.length,
      paidDebts.length,
    ],
  );

  const handleSubmitDebt = async (payload: CreateDebtDto) => {
    if (editDebt) {
      return update(editDebt.id, payload);
    }
    return create(payload);
  };

  const handleDelete = useCallback(
    async (debt: Debt) => {
      if (!confirm(`¿Eliminar "${debt.name}"?`)) return;
      await remove(debt.id);
    },
    [remove],
  );

  const debtColumns: Column<Debt>[] = [
    {
      key: "name",
      header: "Obligación",
      render: (d) => (
        <span className="font-medium text-foreground">{d.name}</span>
      ),
    },
    {
      key: "payee",
      header: "Beneficiario",
      render: (d) => <span className="text-muted-foreground">{d.payee}</span>,
    },
    {
      key: "totalAmount",
      header: "Total",
      className: "text-right",
      render: (d) => (
        <span className="tabular-nums">
          {formatMoney(Number(d.totalAmount))}
        </span>
      ),
    },
    {
      key: "remainingAmount",
      header: "Pendiente",
      className: "text-right",
      render: (d) => (
        <span
          className={`tabular-nums font-medium ${
            d.status === "paid" ? "text-[#00C49A]" : "text-rose-600"
          }`}
        >
          {formatMoney(Number(d.remainingAmount))}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Vencimiento",
      render: (d) => (
        <span className="text-muted-foreground">
          {format(new Date(d.dueDate), "d MMM yyyy", { locale: es })}
        </span>
      ),
    },
    {
      key: "dueProgress",
      header: "Hasta el vencimiento",
      render: (d) => {
        if (d.status === "paid") {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        const { progressPercent, label, daysUntil } = getDebtDueProgressInfo(d);
        return (
          <div className="min-w-[160px] max-w-[220px]">
            <ProgressBar
              label={label}
              value={progressPercent}
              variant={dueProgressVariant(daysUntil)}
            />
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (d) =>
        d.status === "paid" ? (
          <span className="inline-flex rounded-full bg-[#00C49A]/15 px-2.5 py-0.5 text-xs font-medium text-[#0B1829]">
            Pagada
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
            Pendiente
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (d) => {
        const isPaid = d.status === "paid";
        return (
          <div className="flex items-center justify-end gap-1.5">
            {!isPaid && (
              <button
                type="button"
                onClick={() => setRegisterPaymentDebt(d)}
                title="Registrar pago"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1829] text-white transition hover:bg-[#0B1829]/80"
              >
                <DollarSign className="h-4 w-4" />
              </button>
            )}
            {!isPaid && (
              <button
                type="button"
                onClick={() => {
                  setEditDebt(d);
                  setFormOpen(true);
                }}
                title="Editar"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(d)}
              title="Eliminar"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const historyColumns: Column<PaymentHistoryRow>[] = [
    {
      key: "debtName",
      header: "Obligación",
      render: (row) => (
        <span className="font-medium text-foreground">{row.debtName}</span>
      ),
    },
    {
      key: "amount",
      header: "Monto",
      className: "text-right",
      render: (row) => (
        <span className="tabular-nums font-semibold text-[#00C49A]">
          {formatMoney(row.amount)}
        </span>
      ),
    },
    {
      key: "paidAt",
      header: "Fecha",
      className: "text-right",
      render: (row) => (
        <span className="text-muted-foreground">
          {format(new Date(row.paidAt), "d MMM yyyy", { locale: es })}
        </span>
      ),
    },
  ];

  return (
    <>
      <SavvyBannerHome
        title="Mis deudas"
        subtitle="Organiza tus obligaciones y registra pagos. Al registrar un pago, se crea automáticamente una transacción de gasto."
        badgeLabel="Planificador"
        stats={plannerBannerStats}
      />

      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditDebt(null);
            setFormOpen(true);
          }}
          variant="default"
          className="rounded-xl bg-[#0B1829] text-white hover:bg-[#0B1829]/90"
        >
          + Nueva obligación
        </Button>
      </div>

      <div className="mb-4">
        <PlannerTabs
          tabs={plannerTabs}
          value={tab}
          onChange={setTab}
          ariaLabel="Vistas del planificador"
        />
      </div>

      {tab === "obligations" && (
        <section
          role="tabpanel"
          aria-labelledby="tab-obligations"
          className="mb-8"
        >
          <CustomTable
            data={sortedPendingDebts}
            columns={debtColumns}
            loading={loading}
            rowKey={(d) => d.id}
          />
        </section>
      )}

      {tab === "paid" && (
        <section role="tabpanel" aria-labelledby="tab-paid" className="mb-8">
          <CustomTable
            data={sortedPaidDebts}
            columns={debtColumns}
            loading={loading}
            rowKey={(d) => d.id}
          />
        </section>
      )}

      {tab === "history" && (
        <section role="tabpanel" aria-labelledby="tab-history" className="mb-8">
          <CustomTable
            data={paymentHistoryRows}
            columns={historyColumns}
            loading={loading}
            rowKey={(row) => row.id}
          />
        </section>
      )}

      <DebtFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditDebt(null);
        }}
        onSubmit={handleSubmitDebt}
        editData={editDebt}
        loading={loading}
        accounts={accounts}
        defaultAccountId={selectedPaymentAccountId}
      />

      <RegisterPaymentModal
        open={!!registerPaymentDebt}
        onClose={() => setRegisterPaymentDebt(null)}
        debt={registerPaymentDebt}
        accounts={accounts}
        categories={categories}
        defaultAccountId={
          registerPaymentDebt?.accountId ?? selectedPaymentAccountId
        }
        onSubmit={async (debtId, payload) => {
          const ok = await registerPayment(debtId, payload);
          if (ok) setRegisterPaymentDebt(null);
          return ok;
        }}
        loading={loading}
      />
    </>
  );
}
