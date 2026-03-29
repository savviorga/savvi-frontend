import { ApiError } from "@/types/api-error.type";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/waitinglist`;

export interface WaitingListEntry {
  id: string;
  email: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: ApiError = await res.json();
    throw error;
  }
  return res.json();
}

export const WaitingListService = {
  create: async (payload: {
    email: string;
    description?: string;
  }): Promise<WaitingListEntry> => {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<WaitingListEntry>(res);
  },
};
