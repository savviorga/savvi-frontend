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
import type {
  AuthResponse,
  LoginDto,
  RegisterDto,
  TwoFactorChallenge,
  User,
  VerifyTwoFactorDto,
} from "../types/auth.type";

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

/** Con 2FA activo el login no abre sesión: devuelve el reto para pedir el código. */
export type LoginResult =
  | { success: true; callbackUrl: string }
  | { success: false; twoFactor: TwoFactorChallenge };

type AuthContextValue = {
  user: User | null;
  access_token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    payload: LoginDto,
    options?: { callbackUrl?: string }
  ) => Promise<LoginResult>;
  verifyTwoFactor: (
    payload: VerifyTwoFactorDto,
    options?: { callbackUrl?: string }
  ) => Promise<{ success: boolean; callbackUrl?: string }>;
  register: (
    payload: RegisterDto,
    options?: { callbackUrl?: string }
  ) => Promise<{ success: boolean; callbackUrl?: string }>;
  logout: () => void;
  getToken: () => string | null;
  /** Reemplaza el usuario en memoria y en storage (p. ej. tras `PATCH /profile`). */
  updateUser: (user: User) => void;
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

  const startSession = useCallback((data: AuthResponse) => {
    const auth: StoredAuth = {
      user: data.user,
      access_token: data.access_token,
    };
    saveStored(auth);
    setUser(auth.user);
    setAccessToken(auth.access_token);
  }, []);

  const login = useCallback(
    async (
      payload: LoginDto,
      options?: { callbackUrl?: string }
    ): Promise<LoginResult> => {
      const callbackUrl = options?.callbackUrl ?? "/transactions";
      const data = await AuthService.login(payload);
      if (data.requiresTwoFactor) {
        return { success: false, twoFactor: data };
      }
      startSession(data);
      return { success: true, callbackUrl };
    },
    [startSession]
  );

  const verifyTwoFactor = useCallback(
    async (
      payload: VerifyTwoFactorDto,
      options?: { callbackUrl?: string }
    ): Promise<{ success: boolean; callbackUrl?: string }> => {
      const callbackUrl = options?.callbackUrl ?? "/transactions";
      startSession(await AuthService.verifyTwoFactor(payload));
      return { success: true, callbackUrl };
    },
    [startSession]
  );

  const register = useCallback(
    async (
      payload: RegisterDto,
      options?: { callbackUrl?: string }
    ): Promise<{ success: boolean; callbackUrl?: string }> => {
      const callbackUrl = options?.callbackUrl ?? "/transactions";
      startSession(await AuthService.register(payload));
      return { success: true, callbackUrl };
    },
    [startSession]
  );

  const logout = useCallback(() => {
    clearStored();
    setUser(null);
    setAccessToken(null);
    router.replace("/");
  }, [router]);

  const getToken = useCallback(() => access_token, [access_token]);

  const updateUser = useCallback(
    (next: User) => {
      setUser(next);
      if (access_token) saveStored({ user: next, access_token });
    },
    [access_token]
  );

  const value: AuthContextValue = {
    user,
    access_token,
    loading,
    isAuthenticated: !!user,
    login,
    verifyTwoFactor,
    register,
    logout,
    getToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export { AuthContext };
