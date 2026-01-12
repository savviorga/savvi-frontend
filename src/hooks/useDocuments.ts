import { useEffect, useState } from "react";
import { AccountService } from "../services/account.service";
import { Account } from "../types/account.type";

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
