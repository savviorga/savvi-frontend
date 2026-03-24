import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { TransferTemplatesService } from "../services/transfer-templates.service";
import type {
  CreateTransferTemplateDto,
  ExecuteTransferDto,
  TransferTemplate,
  UpdateTransferTemplateDto,
} from "../types/transfer.types";
import { isApiError, getErrorMessages } from "@/types/api-error.type";

export function useTransferTemplates() {
  const [templates, setTemplates] = useState<TransferTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await TransferTemplatesService.getAll();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading transfer templates:", error);
      setTemplates([]);
      toast.error("Error al cargar las transferencias recurrentes");
    } finally {
      setLoading(false);
    }
  }

  async function create(payload: CreateTransferTemplateDto): Promise<boolean> {
    try {
      setLoading(true);
      await TransferTemplatesService.create(payload);
      await load();
      toast.success("Plantilla recurrente creada");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al crear la plantilla");
      }
      setLoading(false);
      return false;
    }
  }

  async function update(
    id: string,
    payload: UpdateTransferTemplateDto
  ): Promise<boolean> {
    try {
      setLoading(true);
      await TransferTemplatesService.update(id, payload);
      await load();
      toast.success("Plantilla actualizada");
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al actualizar la plantilla");
      }
      setLoading(false);
      return false;
    }
  }

  async function toggleActive(id: string): Promise<boolean> {
    try {
      setLoading(true);
      await TransferTemplatesService.toggleActive(id);
      await load();
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al actualizar la plantilla");
      }
      setLoading(false);
      return false;
    }
  }

  async function execute(
    templateId: string,
    payload: Omit<ExecuteTransferDto, "templateId"> & { description?: string }
  ): Promise<boolean> {
    try {
      setLoading(true);
      await TransferTemplatesService.execute(templateId, {
        templateId,
        ...payload,
      });
      await load();
      return true;
    } catch (error) {
      if (isApiError(error)) {
        getErrorMessages(error).forEach((msg) => toast.error(msg));
      } else {
        toast.error("Error al ejecutar la transferencia");
      }
      setLoading(false);
      return false;
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    templates,
    loading,
    reload: load,
    create,
    update,
    toggleActive,
    execute,
  };
}

