import { Router } from "express";

/** Chequeo de salud sin autenticación — útil para monitoreo básico del Mac mini. */
export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
