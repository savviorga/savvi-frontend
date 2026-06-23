import { getBearerAuthHeaders, getJsonAuthHeaders } from "@/lib/api-auth";
import { parseHttpErrorResponse } from "@/lib/parse-http-error-response";
import { getPublicApiUrl } from "@/lib/public-api-url";
import type { ApiError } from "@/types/api-error.type";

export type AiRegisterStatus = "queued" | "processing" | "completed" | "failed";

export interface CreateAiRegisterJobDto {
  key: string;
  name: string;
  size: number;
  mimeType: string;
  userText?: string;
}

export interface AiRegisterJobResponse {
  id: string;
  status: AiRegisterStatus;
  error?: string | null;
  transactionId?: string | null;
}

function aiRegisterApi(): string {
  const root = getPublicApiUrl();
  if (!root) {
    throw {
      message: "Falta NEXT_PUBLIC_API_URL.",
      error: "Config",
      statusCode: 500,
    } satisfies ApiError;
  }
  return `${root}/ai-register/jobs`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await parseHttpErrorResponse(res);
  }
  return res.json();
}

export const AiRegisterService = {
  createJob: async (payload: CreateAiRegisterJobDto): Promise<AiRegisterJobResponse> => {
    const res = await fetch(aiRegisterApi(), {
      method: "POST",
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<AiRegisterJobResponse>(res);
  },

  getJob: async (id: string): Promise<AiRegisterJobResponse> => {
    const res = await fetch(`${aiRegisterApi()}/${id}`, {
      headers: getBearerAuthHeaders(),
    });
    return handleResponse<AiRegisterJobResponse>(res);
  },
};
