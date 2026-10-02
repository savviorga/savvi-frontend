"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldOff } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import type { MutationResult } from "../hooks/useProfile";
import ProfileField from "./ProfileField";

interface TwoFactorDisableModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<MutationResult>;
}

export default function TwoFactorDisableModal({
  open,
  onClose,
  onConfirm,
}: TwoFactorDisableModalProps) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const close = () => {
    setPassword("");
    setVisible(false);
    setError(undefined);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Ingresa tu contraseña actual.");
      return;
    }
    if (saving) return;
    setSaving(true);
    const result = await onConfirm(password);
    setSaving(false);
    if (result.ok) {
      close();
      return;
    }
    setError(
      result.status === 401
        ? "La contraseña no es correcta."
        : result.messages.join(" "),
    );
  };

  const toggle = (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:text-[#0B1829] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/40"
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title="Desactivar verificación en dos pasos"
      description="Confirma tu identidad con tu contraseña actual."
      className="max-w-md"
      headerIcon={<ShieldOff className="h-5 w-5 text-[#00C49A]" strokeWidth={2} />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Sin la verificación en dos pasos, cualquiera que conozca tu contraseña
          podrá entrar a tu cuenta.
        </p>

        <ProfileField
          id="two-factor-disable-password"
          label="Contraseña actual"
          icon={LockKeyhole}
          type={visible ? "text" : "password"}
          value={password}
          onChange={(value) => {
            setPassword(value);
            setError(undefined);
          }}
          error={error}
          autoComplete="current-password"
          trailing={toggle}
        />

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !password}
            className="inline-flex h-10 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-md shadow-rose-900/15 transition-all hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Desactivando…" : "Desactivar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
