"use client";

import { cn } from "@/lib/utils";

type PlannerTabItem<T extends string> = {
  id: T;
  label: string;
  count?: number;
};

type PlannerTabsProps<T extends string> = {
  tabs: PlannerTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
};

export default function PlannerTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel = "Pestañas",
}: PlannerTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 scrollbar-none"
    >
      {tabs.map((tab) => {
        const isActive = value === tab.id;
        const tabId = `tab-${tab.id}`;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            id={tabId}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4",
              isActive
                ? "border-[#00C49A] text-[#0B1829]"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {!!tab.count && tab.count > 0 && (
              <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground sm:ml-2 sm:px-2">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
