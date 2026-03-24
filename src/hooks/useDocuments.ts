import { useEffect, useState } from "react";
import { AccountService } from "../features/accounts/services/account.service";
import type { Account } from "../features/accounts/types/account.type";

export function useDocuments() {
  const [documents, setDocuments] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setDocuments(await AccountService.getAll());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return {
    documents,
    loading,
    reload: load,
  };
}
