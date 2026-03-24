import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RemindersService } from "../services/transfer-templates.service";
import type { Reminder } from "../types/transfer.types";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await RemindersService.getPending();
      setReminders(data);
    } catch (error) {
      console.error("Error loading reminders:", error);
      setReminders([]);
      toast.error("Error al cargar recordatorios");
    } finally {
      setLoading(false);
    }
  }

  async function dismiss(id: string): Promise<boolean> {
    try {
      setLoading(true);
      await RemindersService.dismiss(id);
      await load();
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al posponer el recordatorio");
      }
      setLoading(false);
      return false;
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    reminders,
    loading,
    reload: load,
    dismiss,
  };
}

