"use client";

import { useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import toast from "react-hot-toast";
import { WaitingListService } from "../services/waitinglist.service";
import { celebrateWaitingListJoin } from "../lib/celebrateConfetti";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

const BG = "#050d18";
const MINT = "#00d4aa";

export default function WaitingListLanding() {
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await WaitingListService.create({
        email: email.trim(),
        description: description.trim() || undefined,
      });
      await celebrateWaitingListJoin();
      toast.success("¡Genial, ya estás dentro! Te avisamos cuando abra el acceso.");
      setEmail("");
      setDescription("");
    } catch (err) {
      if (isApiError(err)) {
        getErrorMessages(err).forEach((m) => toast.error(m));
      } else {
        toast.error("No se pudo enviar. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ backgroundColor: BG }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-[20%] top-[10%] h-[min(70vw,520px)] w-[min(70vw,520px)] rounded-full opacity-[0.12]"
          style={{
            background: `radial-gradient(circle, ${MINT} 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute -right-[15%] top-[35%] h-[min(55vw,420px)] w-[min(55vw,420px)] rounded-full opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
            filter: "blur(48px)",
          }}
        />
        <div
          className="absolute bottom-[5%] left-[20%] h-[min(45vw,360px)] w-[min(45vw,360px)] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            filter: "blur(56px)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-5 pb-10 pt-8 sm:px-8 sm:pt-10 lg:px-10 lg:pt-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-lg shadow-[0_0_0_1px_rgba(0,212,170,0.35)]"
              style={{ backgroundColor: MINT }}
            >
              <Star
                className="size-[22px] fill-[#050d18] text-[#050d18]"
                strokeWidth={0}
                aria-hidden
              />
            </div>
            <span className="text-lg font-bold tracking-tight sm:text-xl">
              Savvi
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-mint/40 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: MINT }}
              aria-hidden
            />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mint sm:text-[11px]">
              Lista de espera abierta
            </span>
          </div>
        </header>

        <main className="mt-12 flex flex-1 flex-col sm:mt-16 lg:mt-20">
          <p
            className="text-center text-[11px] font-bold uppercase tracking-[0.2em] sm:text-xs"
            style={{ color: MINT }}
          >
            Próximamente · Cupos limitados
          </p>

          <h1 className="mx-auto mt-4 max-w-2xl text-center text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
            Sé el primero en{" "}
            <span style={{ color: MINT }}>controlar</span> tu plata.
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-center text-sm leading-relaxed text-slate-400 sm:text-base">
            Savvi es la app de finanzas personales que estabas esperando. Déjanos
            tu correo y te avisamos cuando abra el acceso.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 w-full max-w-xl space-y-4 sm:mt-12"
          >
            <label className="sr-only" htmlFor="waitlist-email">
              Email
            </label>
            <input
              id="waitlist-email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/15 bg-black/30 px-4 text-sm text-white placeholder:text-slate-500 outline-none ring-mint/30 transition-[border-color,box-shadow] focus:border-mint/50 focus:ring-2"
            />

            <label
              htmlFor="waitlist-description"
              className="block text-left text-xs font-medium text-slate-400"
            >
              ¿Qué te gustaría que tuviera la app?{" "}
              <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <textarea
              id="waitlist-description"
              rows={4}
              placeholder="Ej.: presupuestos por categoría, alertas de gastos, metas de ahorro…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] w-full resize-y rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none ring-mint/30 transition-[border-color,box-shadow] focus:border-mint/50 focus:ring-2"
            />

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-[#050d18] shadow-lg transition-[transform,opacity] hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
              style={{ backgroundColor: MINT }}
            >
              {loading ? "Enviando…" : "Unirme"}
              {!loading && <ArrowRight className="size-5" strokeWidth={2.5} />}
            </button>
          </form>
        </main>

        <footer className="mt-auto flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-10 sm:flex-row sm:pt-12">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[
                { bg: "bg-blue-500", t: "A" },
                { bg: "bg-cyan-500", t: "M" },
                { bg: "bg-orange-500", t: "C" },
                { bg: "bg-violet-500", t: "L" },
              ].map(({ bg, t }) => (
                <span
                  key={t}
                  className={`flex size-9 items-center justify-center rounded-full border-2 border-[#050d18] text-xs font-bold text-white ${bg}`}
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-mint">+240 personas</span> ya
              en lista
            </p>
          </div>
          <p className="text-xs text-slate-600">savviapp.vercel.app</p>
        </footer>
      </div>
    </div>
  );
}
