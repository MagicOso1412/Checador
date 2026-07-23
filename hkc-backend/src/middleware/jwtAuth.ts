import type { NextFunction, Request, Response } from "express";
import { verificarSesionRh } from "../lib/jwt";

/**
 * Autenticación para el portal RH (personas, vía navegador) — distinta de
 * `apiKeyAuth.ts` (dispositivos), a propósito: son dos tipos de cliente con
 * necesidades distintas. Espera `Authorization: Bearer <jwt>`, y deja los
 * datos de la sesión en `res.locals.sesionRh`.
 */
export function jwtAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;

  if (!token) {
    res.status(401).json({ error: "Falta el header Authorization: Bearer <token>" });
    return;
  }

  const sesion = verificarSesionRh(token);
  if (!sesion) {
    res.status(401).json({ error: "Sesión inválida o expirada" });
    return;
  }

  res.locals.sesionRh = sesion;
  next();
}
