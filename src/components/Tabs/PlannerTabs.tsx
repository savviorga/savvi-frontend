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
    <div role="tablist" aria-label={ariaLabel} className="flex gap-1 border-b border-border">
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
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-[#00C49A] text-[#0B1829]"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {!!tab.count && tab.count > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
