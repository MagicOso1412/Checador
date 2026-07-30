import type { AsistenciasResponse, FiltrosAsistencias, LoginResponse } from "./types";

/**
 * Base URL de `hkc-backend`. `VITE_API_URL` se define en `.env` (ver
 * `.env.example`) cuando el backend está desplegado; en desarrollo local,
 * por defecto asume que corre en `localhost:3000` (`npm run dev` en
 * `hkc-backend/`).
 */
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Error de API con el status HTTP adjunto, para que quien llame pueda
 * distinguir un 401 (sesión expirada → cerrar sesión) de otros errores
 * (mostrar el mensaje tal cual).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function manejarRespuesta<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error ?? `Error ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return manejarRespuesta<LoginResponse>(response);
}

function armarQuery(filtros: FiltrosAsistencias): string {
  const params = new URLSearchParams();
  if (filtros.desde) params.set("desde", filtros.desde);
  if (filtros.hasta) params.set("hasta", filtros.hasta);
  if (filtros.limite) params.set("limite", String(filtros.limite));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function obtenerAsistencias(
  token: string,
  filtros: FiltrosAsistencias,
): Promise<AsistenciasResponse> {
  const response = await fetch(`${API_URL}/api/asistencias${armarQuery(filtros)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return manejarRespuesta<AsistenciasResponse>(response);
}

async function descargarArchivo(url: string, token: string, nombreArchivo: string): Promise<void> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error ?? `Error ${response.status}`, response.status);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

/**
 * Descarga el CSV filtrado y dispara el guardado en el navegador (mismo
 * patrón que `infrastructure/export/exportService.ts` del cliente móvil en
 * web: `Blob` + link temporal).
 */
export async function descargarAsistenciasCsv(token: string, filtros: FiltrosAsistencias): Promise<void> {
  const fecha = new Date().toISOString().slice(0, 10);
  await descargarArchivo(
    `${API_URL}/api/asistencias/export.csv${armarQuery(filtros)}`,
    token,
    `asistencias_${fecha}.csv`,
  );
}

/** Igual que `descargarAsistenciasCsv`, pero el `.xlsx` que genera el backend (`lib/excel.ts`). */
export async function descargarAsistenciasExcel(token: string, filtros: FiltrosAsistencias): Promise<void> {
  const fecha = new Date().toISOString().slice(0, 10);
  await descargarArchivo(
    `${API_URL}/api/asistencias/export.xlsx${armarQuery(filtros)}`,
    token,
    `asistencias_${fecha}.xlsx`,
  );
}
