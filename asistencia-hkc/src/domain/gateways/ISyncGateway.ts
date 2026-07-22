import { Asistencia } from "../entities/Asistencia";

/**
 * Puerto hacia un backend externo de sincronización. Deliberadamente
 * separado de `domain/repositories/`: un repositorio persiste entidades en
 * el almacenamiento local de esta app (SQLite); un gateway las envía a un
 * sistema externo que esta app no controla. Son responsabilidades distintas
 * aunque ambas vivan en `domain/` como interfaces que `infrastructure/`
 * implementa.
 *
 * `enviarAsistencia` debe lanzar si el envío falla (red, servidor, timeout,
 * etc.) — `SincronizarAsistenciasUseCase` decide qué hacer con ese error
 * (registrarlo y seguir con el siguiente registro), no el gateway.
 */
export interface ISyncGateway {
  enviarAsistencia(asistencia: Asistencia): Promise<void>;
}
