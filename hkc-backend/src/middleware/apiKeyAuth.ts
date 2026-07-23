import type { NextFunction, Request, Response } from "express";
import { getDatabase } from "../db/db";

interface DispositivoRow {
  id: string;
  nombre: string;
}

/**
 * Autenticación para endpoints que consumen los dispositivos móviles (no el
 * portal RH, que tendrá su propio mecanismo — ver BACKEND_ARCHITECTURE.md).
 * Espera `Authorization: Bearer <apiKey>`, valida contra la tabla
 * `dispositivos` (debe existir y estar `activo = 1`), y deja el id del
 * dispositivo en `res.locals.dispositivoId` para que la ruta lo use (por
 * ejemplo, para auditoría en `asistencias.dispositivo_id`).
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const apiKey = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;

  if (!apiKey) {
    res.status(401).json({ error: "Falta el header Authorization: Bearer <apiKey>" });
    return;
  }

  const dispositivo = getDatabase()
    .prepare<[string], DispositivoRow>("SELECT id, nombre FROM dispositivos WHERE api_key = ? AND activo = 1")
    .get(apiKey);

  if (!dispositivo) {
    res.status(401).json({ error: "API key inválida o dispositivo inactivo" });
    return;
  }

  res.locals.dispositivoId = dispositivo.id;
  next();
}
