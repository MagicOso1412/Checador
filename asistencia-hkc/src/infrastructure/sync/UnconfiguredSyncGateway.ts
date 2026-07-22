import type { Asistencia } from "../../domain/entities/Asistencia";
import type { ISyncGateway } from "../../domain/gateways/ISyncGateway";

/**
 * Implementación por defecto de `ISyncGateway` mientras no exista un backend
 * real (Sprint 4 todavía no lo tiene). Falla siempre, con un mensaje claro —
 * a propósito: la app no debe fingir que sincronizó algo que en realidad no
 * viajó a ningún lado. `SincronizarAsistenciasUseCase` registra este error
 * por cada registro pendiente (mismo mecanismo que usaría con un error de
 * red real), así que la cola de sincronización (conteos, reintentos,
 * pantalla `/sync`) funciona de extremo a extremo desde ya — lo único que
 * falta es reemplazar este gateway por `HttpSyncGateway` (u otro) apuntando
 * a un servidor real.
 */
export class UnconfiguredSyncGateway implements ISyncGateway {
  async enviarAsistencia(_asistencia: Asistencia): Promise<void> {
    throw new Error("No hay un servidor de sincronización configurado todavía (backend de Sprint 4 pendiente)");
  }
}
