import type { AsistenciaSyncPayload } from "../../application/dto/AsistenciaSyncPayload";
import type { ISyncGateway } from "../../application/gateways/ISyncGateway";

/**
 * Implementación por defecto de `ISyncGateway` mientras no exista un backend
 * desplegado (Sprint 4 ya tiene un proyecto de backend en `hkc-backend/`,
 * pero todavía no corre en el Mac mini). Falla siempre, con un mensaje
 * claro — a propósito: la app no debe fingir que sincronizó algo que en
 * realidad no viajó a ningún lado. `SincronizarAsistenciasUseCase` registra
 * este error por cada registro pendiente (mismo mecanismo que usaría con un
 * error de red real), así que la cola de sincronización (conteos,
 * reintentos, pantalla `/sync`) funciona de extremo a extremo desde ya — lo
 * único que falta es reemplazar este gateway por `HttpSyncGateway` apuntando
 * a un servidor real.
 */
export class UnconfiguredSyncGateway implements ISyncGateway {
  async enviarAsistencia(_payload: AsistenciaSyncPayload): Promise<void> {
    throw new Error("No hay un servidor de sincronización configurado todavía (backend de Sprint 4 pendiente de desplegar)");
  }
}
