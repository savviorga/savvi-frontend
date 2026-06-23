"use client";

import type { LucideIcon } from "lucide-react";

interface DashboardSectionHeadingProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export default function DashboardSectionHeading({
  title,
  description,
  icon: Icon,
}: DashboardSectionHeadingProps) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {Icon ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint/10">
          <Icon className="h-4 w-4 text-mint" aria-hidden />
        </div>
      ) : null}
      <div>
        <h2 className="text-base font-semibold tracking-tight text-[#0B1829]">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
