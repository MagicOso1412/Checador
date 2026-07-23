import type { AsistenciaSyncPayload } from "../dto/AsistenciaSyncPayload";

/**
 * Puerto hacia un backend externo de sincronización. Vive en `application/`
 * (no en `domain/`, donde se definió originalmente) porque opera sobre
 * `AsistenciaSyncPayload` — un modelo de lectura ya denormalizado de esta
 * capa, no sobre la entidad de dominio pura `Asistencia`. Mismo criterio que
 * `application/services/historialCsv.ts`: transformar datos para que salgan
 * de la app es responsabilidad de `application/`, y un gateway que depende
 * de un DTO de esa capa debe vivir ahí también, no en `domain/` (que no debe
 * conocer DTOs de capas superiores).
 *
 * `enviarAsistencia` debe lanzar si el envío falla (red, servidor, timeout,
 * etc.) — `SincronizarAsistenciasUseCase` decide qué hacer con ese error
 * (registrarlo y seguir con el siguiente registro), no el gateway.
 */
export interface ISyncGateway {
  enviarAsistencia(payload: AsistenciaSyncPayload): Promise<void>;
}
