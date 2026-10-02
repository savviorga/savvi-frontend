"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Markdown de las respuestas del asesor. Sin `rehype-raw`: el HTML crudo no se
 * interpreta y react-markdown ya neutraliza enlaces `javascript:`.
 */
const components: Components = {
  p: ({ children }) => <p className="[&:not(:first-child)]:mt-2">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-600"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mt-2 space-y-1 pl-1 first:mt-0">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5 first:mt-0 marker:text-slate-400">{children}</ol>,
  li: ({ children, className }) =>
    // Las listas numeradas usan el marcador nativo; las de guiones, un punto mint.
    className?.includes("task-list-item") ? (
      <li className="flex items-start gap-2">{children}</li>
    ) : (
      <li className="relative pl-4 [ol_&]:pl-0 before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald-400 [ol_&]:before:hidden">
        {children}
      </li>
    ),
  h1: ({ children }) => <p className="mt-2 font-semibold text-slate-900 first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mt-2 font-semibold text-slate-900 first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mt-2 font-semibold text-slate-900 first:mt-0">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="mt-2 rounded-r-lg border-l-2 border-emerald-300 bg-emerald-50/60 px-3 py-1.5 text-slate-600 first:mt-0">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-slate-700">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs first:mt-0">{children}</pre>
  ),
  hr: () => <hr className="my-3 border-slate-100" />,
  table: ({ children }) => (
    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 first:mt-0">
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50 text-xs text-slate-500">{children}</thead>,
  th: ({ children }) => <th className="whitespace-nowrap px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-slate-100 px-3 py-2 tabular-nums">{children}</td>,
  input: ({ checked }) => (
    <span
      className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
        checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
      }`}
      aria-label={checked ? "Hecho" : "Pendiente"}
    >
      {checked ? "✓" : ""}
    </span>
  ),
};

function SavviIAMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}

export default memo(SavviIAMarkdown);
