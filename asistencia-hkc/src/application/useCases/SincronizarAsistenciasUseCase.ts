import type { ISyncGateway } from "../../domain/gateways/ISyncGateway";
import type { IAsistenciaRepository } from "../../domain/repositories/IAsistenciaRepository";

export interface ErrorSincronizacion {
  asistenciaId: string;
  mensaje: string;
}

export interface ResultadoSincronizacion {
  exitosos: number;
  fallidos: number;
  errores: ErrorSincronizacion[];
}

const LIMITE_POR_CORRIDA = 50;

/**
 * Procesa la cola de sincronización: toma los registros pendientes (más
 * antiguos primero), intenta enviarlos uno por uno vía `ISyncGateway` y
 * actualiza su estado según el resultado. Secuencial a propósito (no en
 * paralelo) — es más simple de razonar y no satura un backend real cuando
 * exista, y el volumen esperado por corrida (registros de un dispositivo
 * local) es pequeño.
 *
 * Un fallo en un registro no detiene a los demás: se registra el error
 * (`registrarIntentoFallido`) y se sigue con el siguiente. Así, con el
 * `UnconfiguredSyncGateway` de hoy, correr esto deja todos los pendientes
 * con un error claro en vez de bloquear la cola.
 */
export class SincronizarAsistenciasUseCase {
  constructor(
    private readonly asistenciaRepository: IAsistenciaRepository,
    private readonly syncGateway: ISyncGateway,
  ) {}

  async execute(onProgreso?: (procesados: number, total: number) => void): Promise<ResultadoSincronizacion> {
    const pendientes = await this.asistenciaRepository.obtenerPendientesDeSincronizar(LIMITE_POR_CORRIDA);

    const resultado: ResultadoSincronizacion = { exitosos: 0, fallidos: 0, errores: [] };

    for (let i = 0; i < pendientes.length; i++) {
      const asistencia = pendientes[i];
      try {
        await this.syncGateway.enviarAsistencia(asistencia);
        await this.asistenciaRepository.marcarComoSincronizado(asistencia.id);
        resultado.exitosos++;
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido al sincronizar";
        await this.asistenciaRepository.registrarIntentoFallido(asistencia.id, mensaje);
        resultado.fallidos++;
        resultado.errores.push({ asistenciaId: asistencia.id, mensaje });
      }

      onProgreso?.(i + 1, pendientes.length);
    }

    return resultado;
  }
}
