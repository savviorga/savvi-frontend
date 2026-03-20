"use client";

import { useEffect, useState } from "react";
import SavvyBanner from "@/components/Banner/SavvyBanner";
import { Button } from "@/components/ui/button";
import { usePaymentPlanner } from "@/features/payment-planner/hooks/usePaymentPlanner";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCategories } from "@/features/categories/hooks/useCategories";
import SavvySelect from "@/components/Select/Select";
import DebtFormModal from "@/features/payment-planner/components/DebtFormModal";
import RegisterPaymentModal from "@/features/payment-planner/components/RegisterPaymentModal";
import DebtCard from "@/features/payment-planner/components/DebtCard";
import type { Debt, CreateDebtDto } from "@/features/payment-planner/types/debt.types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function PlanificadorPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [registerPaymentDebt, setRegisterPaymentDebt] = useState<Debt | null>(null);
  const [selectedPaymentAccountId, setSelectedPaymentAccountId] =
    useState<string>("");

  const {
    debts,
    totalPaid,
    loading,
    create,
    update,
    remove,
    registerPayment,
    reload,
  } = usePaymentPlanner();
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
    0
  );

  const handleSubmitDebt = async (payload: CreateDebtDto) => {
    if (editDebt) {
      return update(editDebt.id, payload);
    }
    return create(payload);
  };

  const handleDelete = async (debt: Debt) => {
    if (!confirm(`¿Eliminar "${debt.name}"?`)) return;
    await remove(debt.id);
  };

  if (loading && debts.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-500">Cargando planificador…</p>
      </div>
    );
  }

  return (
    <>
      <SavvyBanner
        title="Mis deudas"
        subtitle="Organiza tus obligaciones y registra pagos. Al registrar un pago, se crea automáticamente una transacción de gasto."
      />

      {/* Resumen */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-200/30">
          <p className="text-sm font-medium text-slate-500">Pendiente por pagar</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            {formatMoney(totalPending)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {pendingDebts.length} obligación(es)
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-200/30">
          <p className="text-sm font-medium text-slate-500">Total pagado</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatMoney(totalPaid)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Historial de pagos</p>
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-lg shadow-slate-200/30">
          <p className="text-sm font-medium text-slate-500">Obligaciones</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{debts.length}</p>
          <p className="mt-1 text-xs text-slate-400">
            {pendingDebts.length} pendientes, {paidDebts.length} pagadas
          </p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setEditDebt(null);
            setFormOpen(true);
          }}
          variant="default"
          className="rounded-xl"
        >
          + Nueva obligación
        </Button>
      </div>

      {/* Lista de pendientes */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Pendientes por pagar
        </h2>
        {pendingDebts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-slate-500">
            No hay obligaciones pendientes. Añade una para organizar tus pagos.
          </p>
        ) : (
          <div className="space-y-4">
            {pendingDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onRegisterPayment={setRegisterPaymentDebt}
                onEdit={(d) => {
                  setEditDebt(d);
                  setFormOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Lista de pagadas */}
      {paidDebts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Pagadas
          </h2>
          <div className="space-y-4">
            {paidDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onRegisterPayment={() => {}}
                onEdit={(d) => {
                  setEditDebt(d);
                  setFormOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Historial de pagos (todas las deudas) */}
      {debts.some((d) => d.payments && d.payments.length > 0) && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Historial de pagos
          </h2>
          <div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-slate-200/30 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {debts.map((debt) =>
                (debt.payments ?? []).map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-700">{debt.name}</span>
                    <span className="text-emerald-600">
                      {formatMoney(Number(payment.amount))}
                    </span>
                    <span className="text-slate-500">
                      {format(new Date(payment.paidAt), "d MMM yyyy", {
                        locale: es,
                      })}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
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
        defaultAccountId={registerPaymentDebt?.accountId ?? selectedPaymentAccountId}
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
