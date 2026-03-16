"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "../services/auth.service";
import type { User } from "../types/auth.type";
import { LoginDto, RegisterDto } from "../types/auth.type";

const STORAGE_KEY = "savvi_auth";

type StoredAuth = {
  user: User;
  access_token: string;
};

function readStored(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredAuth;
    if (!data?.user || !data?.access_token) return null;
    return data;
  } catch {
    return null;
  }
}

function clearStored(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function saveStored(auth: StoredAuth): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

type AuthContextValue = {
  user: User | null;
  access_token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    payload: LoginDto,
    options?: { callbackUrl?: string }
  ) => Promise<{ success: boolean; callbackUrl?: string }>;
  register: (
    payload: RegisterDto,
    options?: { callbackUrl?: string }
  ) => Promise<{ success: boolean; callbackUrl?: string }>;
  logout: () => void;
  getToken: () => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [access_token, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setUser(stored.user);
      setAccessToken(stored.access_token);
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (
      payload: LoginDto,
      options?: { callbackUrl?: string }
    ): Promise<{ success: boolean; callbackUrl?: string }> => {
      const callbackUrl = options?.callbackUrl ?? "/transactions";
      const data = await AuthService.login(payload);
      const auth: StoredAuth = {
        user: data.user,
        access_token: data.access_token,
      };
      saveStored(auth);
      setUser(auth.user);
      setAccessToken(auth.access_token);
      return { success: true, callbackUrl };
    },
    []
  );

  const register = useCallback(
    async (
      payload: RegisterDto,
      options?: { callbackUrl?: string }
    ): Promise<{ success: boolean; callbackUrl?: string }> => {
      const callbackUrl = options?.callbackUrl ?? "/transactions";
      const data = await AuthService.register(payload);
      const auth: StoredAuth = {
        user: data.user,
        access_token: data.access_token,
      };
      saveStored(auth);
      setUser(auth.user);
      setAccessToken(auth.access_token);
      return { success: true, callbackUrl };
    },
    []
  );

  const logout = useCallback(() => {
    clearStored();
    setUser(null);
    setAccessToken(null);
    router.replace("/");
  }, [router]);

  const getToken = useCallback(() => access_token, [access_token]);

  const value: AuthContextValue = {
    user,
    access_token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export { AuthContext };
