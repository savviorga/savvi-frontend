"use client";

import { TrendingUp } from "lucide-react";

interface SavvyBannerProps {
  title: string;
  subtitle?: string;
}

export default function SavvyBanner({ title, subtitle }: SavvyBannerProps) {
  return (
    <section className="relative mb-8 w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl shadow-slate-200/50">
      {/* Gradient accent top border */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-400/15 via-teal-400/10 to-emerald-400/5 blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(100 116 139) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Dashboard
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-2 text-lg leading-relaxed text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {/* Decorative icon */}
        <div className="hidden shrink-0 lg:block">
          <div className="relative">
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-cyan-400/20 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/25">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
