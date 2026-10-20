"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AuthService } from "../services/auth.service";
import {
  getTokenAge,
  isTokenExpired,
  watchRejectedSession,
} from "@/lib/api-auth";
import type {
  AuthResponse,
  LoginDto,
  RegisterDto,
  TwoFactorChallenge,
  User,
  VerifyTwoFactorDto,
} from "../types/auth.type";

const STORAGE_KEY = "savvi_auth";

const SESSION_EXPIRED_TOAST_ID = "session-expired";
const SESSION_EXPIRED_MESSAGE = "Tu sesión expiró. Inicia sesión de nuevo.";
/** Con más de un día de antigüedad el token se renueva: un usuario activo no llega a los 7 días de vencimiento. */
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;
/** Revisión periódica con la app abierta (cubre también el equipo que vuelve de suspensión). */
const CHECK_INTERVAL_MS = 60 * 1000;
/** Tras un fallo de red en la renovación, espera antes de reintentar. */
const REFRESH_RETRY_MS = 5 * 60 * 1000;

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

/** Datos de Savvi IA guardados en el navegador (conversación con datos financieros). */
const SAVVI_IA_KEY_PREFIX = "savvi_ia_";

/** Al cerrar sesión no queda nada del usuario en este navegador. */
function clearUserData(): void {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(SAVVI_IA_KEY_PREFIX));
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* sin acceso a localStorage */
  }
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
  /**
   * Guarda una sesión nueva que devolvió el backend tras un cambio de
   * seguridad (contraseña, 2FA, email): las demás sesiones quedan cerradas.
   */
  replaceSession: (data: AuthResponse) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [access_token, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStored();
    if (stored && isTokenExpired(stored.access_token)) {
      clearStored();
      toast.error(SESSION_EXPIRED_MESSAGE, { id: SESSION_EXPIRED_TOAST_ID });
    } else if (stored) {
      setUser(stored.user);
      setAccessToken(stored.access_token);
    }
    setLoading(false);
  }, []);

  // Otra pestaña renovó el token o cerró sesión: esta se pone al día.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      const stored = readStored();
      setUser(stored?.user ?? null);
      setAccessToken(stored?.access_token ?? null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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

  /** Sin redirigir: `ProtectedRoute` manda a /login con `callbackUrl` para volver a la misma página. */
  const expireSession = useCallback(() => {
    clearStored();
    setUser(null);
    setAccessToken(null);
    toast.error(SESSION_EXPIRED_MESSAGE, { id: SESSION_EXPIRED_TOAST_ID });
  }, []);

  useEffect(() => watchRejectedSession(expireSession), [expireSession]);

  // Cierra la sesión al vencer el token y la renueva mientras el usuario usa la app.
  useEffect(() => {
    if (!access_token) return;
    let refreshing = false;
    let lastAttempt = 0;

    const check = async () => {
      if (isTokenExpired(access_token)) {
        expireSession();
        return;
      }
      const age = getTokenAge(access_token);
      if (
        age === null ||
        age < REFRESH_AFTER_MS ||
        refreshing ||
        document.visibilityState !== "visible" ||
        Date.now() - lastAttempt < REFRESH_RETRY_MS
      ) {
        return;
      }
      refreshing = true;
      lastAttempt = Date.now();
      try {
        startSession(await AuthService.refresh(access_token));
      } catch {
        // Un 401 lo resuelve watchRejectedSession; un fallo de red se reintenta luego.
      } finally {
        refreshing = false;
      }
    };

    void check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [access_token, expireSession, startSession]);

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
    clearUserData();
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
    replaceSession: startSession,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export { AuthContext };
