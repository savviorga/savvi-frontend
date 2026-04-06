"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";
import type { Transaction } from "../types/transactions.types";
import type { Category } from "../types/catalog.types";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const todayISO = () => new Date().toISOString().slice(0, 10);

type QuickFilter = "today" | "yesterday" | "month" | "all";

interface MobileReportViewProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function MobileReportView({
  transactions,
  categories,
}: MobileReportViewProps) {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("today");
  const [fromDate, setFromDate] = useState(todayISO);
  const [toDate, setToDate] = useState(todayISO);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const applyFilter = (filter: QuickFilter) => {
    setQuickFilter(filter);
    setShowDatePicker(false);
    switch (filter) {
      case "today":
        setFromDate(todayISO());
        setToDate(todayISO());
        break;
      case "yesterday": {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const iso = y.toISOString().slice(0, 10);
        setFromDate(iso);
        setToDate(iso);
        break;
      }
      case "month": {
        const now = new Date();
        setFromDate(
          new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .slice(0, 10),
        );
        setToDate(todayISO());
        break;
      }
      case "all": {
        const dates = transactions
          .map((t) => t.date)
          .filter(Boolean)
          .sort();
        if (dates.length) {
          setFromDate(dates[0]);
          setToDate(dates[dates.length - 1]);
        }
        break;
      }
    }
  };

  const selectDay = (iso: string) => {
    setFromDate(iso);
    setToDate(iso);
    setQuickFilter("today");
  };

  const filtered = useMemo(
    () =>
      transactions.filter((tx) => {
        const d = tx.date?.slice(0, 10) ?? "";
        return d >= fromDate && d <= toDate;
      }),
    [transactions, fromDate, toDate],
  );

  const isSingleDay = fromDate === toDate;

  const summary = useMemo(() => {
    let totalExpenses = 0;
    let totalIncome = 0;
    for (const tx of filtered) {
      const amt = Number(tx.amount || 0);
      if (tx.type === "egreso") totalExpenses += amt;
      else if (tx.type === "ingreso") totalIncome += amt;
    }
    return { totalExpenses, totalIncome, count: filtered.length };
  }, [filtered]);

  const catMap = useMemo(() => {
    const m = new Map<string, Category>();
    for (const c of categories) m.set(c.name, c);
    return m;
  }, [categories]);

  const dailyAvg = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const today = todayISO();
    const daysSet = new Set<string>();
    let totalEgreso = 0;
    for (const tx of transactions) {
      const d = tx.date?.slice(0, 10) ?? "";
      if (d >= monthStart && d <= today && tx.type === "egreso") {
        totalEgreso += Number(tx.amount || 0);
        daysSet.add(d);
      }
    }
    const dayCount = Math.max(daysSet.size, 1);
    return totalEgreso / dayCount;
  }, [transactions]);

  const heatmapDays = useMemo(() => {
    const dailyTotals = new Map<string, number>();
    for (const tx of transactions) {
      const d = tx.date?.slice(0, 10) ?? "";
      if (!d || tx.type !== "egreso") continue;
      dailyTotals.set(d, (dailyTotals.get(d) ?? 0) + Number(tx.amount || 0));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: {
      iso: string;
      dayNum: number;
      weekday: string;
      total: number;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({
        iso,
        dayNum: d.getDate(),
        weekday: format(d, "EEE", { locale: es }),
        total: dailyTotals.get(iso) ?? 0,
      });
    }
    return days;
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const grouped = new Map<
      string,
      { total: number; type: string }
    >();
    for (const tx of filtered) {
      if (tx.type !== "egreso") continue;
      const cat = tx.category || "Sin categoría";
      const prev = grouped.get(cat);
      grouped.set(cat, {
        total: (prev?.total ?? 0) + Number(tx.amount || 0),
        type: tx.type,
      });
    }
    return Array.from(grouped.entries())
      .map(([name, { total }]) => {
        const meta = catMap.get(name);
        return {
          name,
          total,
          color: meta?.color ?? "#94a3b8",
          icon: meta?.icon ?? null,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filtered, catMap]);

  const sortedTransactions = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => Number(b.amount || 0) - Number(a.amount || 0),
      ),
    [filtered],
  );

  const selectedDayTotal = useMemo(() => {
    if (!isSingleDay) return summary.totalExpenses;
    return heatmapDays.find((d) => d.iso === fromDate)?.total ?? summary.totalExpenses;
  }, [isSingleDay, fromDate, heatmapDays, summary]);

  const vsAvgPercent = dailyAvg > 0 ? Math.round((selectedDayTotal / dailyAvg) * 100) : 0;

  const dateLabel = useMemo(() => {
    if (isSingleDay) {
      return format(new Date(`${fromDate}T12:00:00`), "d 'de' MMMM, yyyy", {
        locale: es,
      });
    }
    const from = format(new Date(`${fromDate}T12:00:00`), "d MMM", { locale: es });
    const to = format(new Date(`${toDate}T12:00:00`), "d MMM, yyyy", { locale: es });
    return `${from} – ${to}`;
  }, [fromDate, toDate, isSingleDay]);

  const mainAmount = summary.totalExpenses || summary.totalIncome;
  const mainAmountColor =
    summary.totalIncome > summary.totalExpenses
      ? "text-emerald-600"
      : summary.totalExpenses > 0
        ? "text-rose-600"
        : "text-foreground";

  return (
    <section className="space-y-4">
      {/* 1. Quick filter pills */}
      <div className="flex items-center gap-2">
        {(
          [
            { key: "today", label: "Hoy" },
            { key: "yesterday", label: "Ayer" },
            { key: "month", label: "Este mes" },
            { key: "all", label: "Todo" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => applyFilter(key)}
            className={`rounded-[20px] px-4 py-1.5 text-sm font-medium transition ${
              quickFilter === key
                ? "bg-[#0B1829] text-white shadow-sm"
                : "border border-border bg-white text-foreground hover:bg-muted/50"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowDatePicker((p) => !p)}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-[20px] border border-border bg-white transition hover:bg-muted/50"
          aria-label="Seleccionar fecha"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {showDatePicker && (
        <div className="flex gap-2 rounded-xl border border-border bg-white p-3 shadow-sm">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setQuickFilter("today");
              }}
              className="h-9 w-full rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-[#00C49A]/25"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setQuickFilter("today");
              }}
              className="h-9 w-full rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-[#00C49A]/25"
            />
          </div>
        </div>
      )}

      {/* 2. Central KPI */}
      <div className="text-center">
        <p className="text-[13px] text-muted-foreground">{dateLabel}</p>
        <p className={`mt-1 text-[28px] font-medium leading-tight ${mainAmountColor}`}>
          {formatMoney(mainAmount)}
        </p>
        {summary.totalIncome > 0 && summary.totalExpenses > 0 && (
          <p className="mt-0.5 text-xs text-emerald-600">
            Ingresos: {formatMoney(summary.totalIncome)}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {summary.count} transaccion{summary.count !== 1 ? "es" : ""}
        </p>
      </div>

      {/* 3. Week heatmap */}
      <WeekStrip
        days={heatmapDays}
        dailyAvg={dailyAvg}
        selectedDate={isSingleDay ? fromDate : null}
        onDayClick={selectDay}
      />

      {/* 4. Spend vs average bar */}
      {isSingleDay && dailyAvg > 0 && (
        <SpendVsAverageBar percent={vsAvgPercent} />
      )}

      {/* 5. Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Detalle del día
          </h3>
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => {
              const maxTotal = categoryBreakdown[0].total;
              const barWidth = maxTotal > 0 ? (cat.total / maxTotal) * 100 : 0;
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                    }}
                  >
                    {cat.icon ? (
                      <span className="text-base">{cat.icon}</span>
                    ) : (
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {cat.name}
                    </p>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                    {formatMoney(cat.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Transaction list */}
      {sortedTransactions.length > 0 && (
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Transacciones
          </h3>
          <div className="divide-y divide-border/50">
            {sortedTransactions.map((tx) => {
              const catMeta = catMap.get(tx.category);
              const dotColor = catMeta?.color ?? "#94a3b8";
              const amountColor =
                tx.type === "egreso"
                  ? "text-rose-600"
                  : tx.type === "ingreso"
                    ? "text-emerald-600"
                    : "text-foreground";
              const sign = tx.type === "egreso" ? "-" : tx.type === "ingreso" ? "+" : "";
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {tx.description || tx.category}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {tx.category}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[13px] font-medium tabular-nums ${amountColor}`}
                  >
                    {sign}{formatMoney(Number(tx.amount || 0))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay transacciones en este período.
          </p>
        </div>
      )}
    </section>
  );
}

/* ── Sub-components ── */

const HEAT_COLORS = {
  none: { bg: "bg-muted/50", text: "text-muted-foreground" },
  low: { bg: "", text: "text-emerald-900", hex: "#E1F5EE" },
  mid: { bg: "", text: "text-white", hex: "#5DCAA5" },
  high: { bg: "", text: "text-white", hex: "#EF9F27" },
  veryHigh: { bg: "", text: "text-white", hex: "#E24B4A" },
};

function getHeatStyle(
  total: number,
  avg: number,
): { backgroundColor?: string; className: string } {
  if (total === 0)
    return { className: `${HEAT_COLORS.none.bg} ${HEAT_COLORS.none.text}` };
  const ratio = avg > 0 ? total / avg : 1;
  if (ratio < 0.5)
    return {
      backgroundColor: HEAT_COLORS.low.hex,
      className: HEAT_COLORS.low.text,
    };
  if (ratio <= 1)
    return {
      backgroundColor: HEAT_COLORS.mid.hex,
      className: HEAT_COLORS.mid.text,
    };
  if (ratio <= 1.5)
    return {
      backgroundColor: HEAT_COLORS.high.hex,
      className: HEAT_COLORS.high.text,
    };
  return {
    backgroundColor: HEAT_COLORS.veryHigh.hex,
    className: HEAT_COLORS.veryHigh.text,
  };
}

function WeekStrip({
  days,
  dailyAvg,
  selectedDate,
  onDayClick,
}: {
  days: { iso: string; dayNum: number; weekday: string; total: number }[];
  dailyAvg: number;
  selectedDate: string | null;
  onDayClick: (iso: string) => void;
}) {
  const todayStr = todayISO();

  return (
    <div className="flex items-center justify-between gap-1.5">
      {days.map((day) => {
        const isSelected = day.iso === selectedDate;
        const isToday = day.iso === todayStr;
        const heat = getHeatStyle(day.total, dailyAvg);
        return (
          <button
            key={day.iso}
            type="button"
            onClick={() => onDayClick(day.iso)}
            className={`flex flex-1 flex-col items-center rounded-lg py-1.5 transition-all duration-200 ${heat.className} ${
              isSelected
                ? "ring-2 ring-[#0B1829] ring-offset-1"
                : isToday
                  ? "ring-2 ring-[#00C49A] ring-offset-1"
                  : ""
            }`}
            style={heat.backgroundColor ? { backgroundColor: heat.backgroundColor } : undefined}
          >
            <span className="text-base font-bold leading-tight">
              {day.dayNum}
            </span>
            <span className="mt-0.5 text-[10px] leading-none opacity-70">
              {day.weekday}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SpendVsAverageBar({ percent }: { percent: number }) {
  const fillColor =
    percent <= 100
      ? "#5DCAA5"
      : percent <= 150
        ? "#EF9F27"
        : "#E24B4A";

  const clampedWidth = Math.min(percent, 200);

  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3.5 py-2.5">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        Hoy vs promedio
      </span>
      <div className="relative flex-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(clampedWidth / 2, 100)}%`,
              backgroundColor: fillColor,
            }}
          />
        </div>
        <div
          className="absolute top-0 h-full w-[2px] bg-foreground/60"
          style={{ left: "50%" }}
        />
      </div>
      <span
        className="shrink-0 text-xs font-semibold tabular-nums"
        style={{ color: fillColor }}
      >
        {percent}%
      </span>
    </div>
  );
}
