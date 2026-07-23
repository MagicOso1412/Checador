import type { NextFunction, Request, Response } from "express";

/**
 * Manejador de errores centralizado — evita que un error no capturado en
 * una ruta tumbe el proceso o devuelva el stack trace crudo al cliente.
 * Debe registrarse al final de la cadena de middlewares en `app.ts`.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error("[error]", err);

  if (res.headersSent) return;

  res.status(500).json({
    error: err instanceof Error ? err.message : "Error interno del servidor",
  });
}
