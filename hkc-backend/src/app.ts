import cors from "cors";
import express, { type Express } from "express";
import { asistenciasRouter } from "./routes/asistencias.routes";
import { authRouter } from "./routes/auth.routes";
import { healthRouter } from "./routes/health.routes";
import { errorHandler } from "./middleware/errorHandler";

/**
 * Orígenes desde los que el navegador puede llamar a esta API. El portal RH
 * es una SPA servida desde un origen distinto al de este backend (puertos
 * distintos en desarrollo, dominios distintos en producción), así que sin
 * CORS el navegador bloquea el `fetch` antes de que salga — se ve del lado
 * del portal como un genérico "Failed to fetch", sin ningún detalle útil.
 *
 * `CORS_ORIGIN` acepta una lista separada por comas (para cuando el portal
 * termine desplegado en su dominio real). Sin definir, cae a los puertos de
 * desarrollo de Vite (`5173`, y `4173` para `vite preview`) — no a `*`,
 * porque este API usa JWT en `Authorization`, no cookies, así que no hay
 * riesgo real de CSRF, pero sí queremos que quede explícito qué front-ends
 * están autorizados a llamar a la API en vez de aceptar cualquier origen.
 * No afecta al cliente móvil: `HttpSyncGateway` llama desde la app nativa,
 * no desde un navegador, y CORS solo lo aplican los navegadores.
 */
const origenesPermitidos = (
  process.env.CORS_ORIGIN?.split(",").map((origen) => origen.trim()) ?? [
    "http://localhost:5173",
    "http://localhost:4173",
  ]
);

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: origenesPermitidos }));
  app.use(express.json({ limit: "2mb" }));

  app.use(healthRouter);
  app.use(authRouter);
  app.use(asistenciasRouter);

  app.use(errorHandler);

  return app;
}
