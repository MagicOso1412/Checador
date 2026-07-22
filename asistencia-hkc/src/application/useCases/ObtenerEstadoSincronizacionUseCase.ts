import type { IAsistenciaRepository } from "../../domain/repositories/IAsistenciaRepository";

export interface EstadoSincronizacion {
  pendientes: number;
  conError: number;
}

/**
 * Conteo rápido de la cola de sincronización para mostrar en pantalla
 * (`/sync`, `admin.tsx`) sin necesidad de correr `SincronizarAsistenciasUseCase`.
 * "Con error" es un subconjunto de "pendientes": registros que ya tuvieron
 * al menos un intento fallido y siguen sin sincronizarse.
 */
export class ObtenerEstadoSincronizacionUseCase {
  constructor(private readonly asistenciaRepository: IAsistenciaRepository) {}

  async execute(): Promise<EstadoSincronizacion> {
    const pendientes = await this.asistenciaRepository.obtenerPendientesDeSincronizar();

    return {
      pendientes: pendientes.length,
      conError: pendientes.filter((a) => a.ultimoErrorSincronizacion !== null).length,
    };
  }
}
