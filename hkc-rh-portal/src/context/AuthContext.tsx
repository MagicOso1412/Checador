import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { login as loginRequest } from "../api/client";
import type { UsuarioRh } from "../api/types";

const CLAVE_STORAGE = "hkc_rh_sesion";

interface SesionGuardada {
  token: string;
  usuario: UsuarioRh;
}

interface AuthContextValue {
  token: string | null;
  usuario: UsuarioRh | null;
  cargando: boolean;
  error: string | null;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function leerSesionGuardada(): SesionGuardada | null {
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE);
    return raw ? (JSON.parse(raw) as SesionGuardada) : null;
  } catch {
    return null;
  }
}

/**
 * Sesión de RH persistida en `localStorage` (JWT + datos del usuario). Es un
 * token stateless de 8 horas (ver `hkc-backend/src/lib/jwt.ts`) — si expiró,
 * la próxima llamada a la API responde 401 y las páginas que consumen
 * `useAuth()` deben llamar `cerrarSesion()` y mandar a `/login`, no hay
 * validación local de expiración aquí.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionGuardada | null>(() => leerSesionGuardada());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciarSesion = async (email: string, password: string) => {
    setCargando(true);
    setError(null);
    try {
      const { token, usuario } = await loginRequest(email, password);
      const nuevaSesion = { token, usuario };
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(nuevaSesion));
      setSesion(nuevaSesion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem(CLAVE_STORAGE);
    setSesion(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token: sesion?.token ?? null,
      usuario: sesion?.usuario ?? null,
      cargando,
      error,
      iniciarSesion,
      cerrarSesion,
    }),
    [sesion, cargando, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
