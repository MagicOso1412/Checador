import type { AsistenciaSyncPayload } from "../dto/AsistenciaSyncPayload";
import type { ISyncGateway } from "../gateways/ISyncGateway";
import type { IAsistenciaRepository } from "../../domain/repositories/IAsistenciaRepository";
import type { IProyectoRepository } from "../../domain/repositories/IProyectoRepository";
import type { ITrabajadorRepository } from "../../domain/repositories/ITrabajadorRepository";

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
 * antiguos primero), los arma como `AsistenciaSyncPayload` (denormalizado,
 * con nombre de trabajador/proyecto — mismo join en memoria que
 * `ObtenerHistorialUseCase`, por eso depende también de
 * `ITrabajadorRepository`/`IProyectoRepository`) y los intenta enviar uno
 * por uno vía `ISyncGateway`. Secuencial a propósito (no en paralelo) — más
 * simple de razonar y no satura un backend real cuando exista.
 *
 * Un fallo en un registro no detiene a los demás: se registra el error
 * (`registrarIntentoFallido`) y se sigue con el siguiente. Así, con el
 * `UnconfiguredSyncGateway` de hoy, correr esto deja todos los pendientes
 * con un error claro en vez de bloquear la cola.
 */
export class SincronizarAsistenciasUseCase {
  constructor(
    private readonly asistenciaRepository: IAsistenciaRepository,
    private readonly trabajadorRepository: ITrabajadorRepository,
    private readonly proyectoRepository: IProyectoRepository,
    private readonly syncGateway: ISyncGateway,
  ) {}

  async execute(onProgreso?: (procesados: number, total: number) => void): Promise<ResultadoSincronizacion> {
    const pendientes = await this.asistenciaRepository.obtenerPendientesDeSincronizar(LIMITE_POR_CORRIDA);

    const resultado: ResultadoSincronizacion = { exitosos: 0, fallidos: 0, errores: [] };

    if (pendientes.length === 0) {
      return resultado;
    }

    // Mismo patrón que ObtenerHistorialUseCase: traer trabajadores/proyectos
    // completos y cruzarlos en memoria (tablas pequeñas y locales), en vez
    // de un lookup por registro.
    const [trabajadores, proyectos] = await Promise.all([
      this.trabajadorRepository.obtenerTodos(),
      this.proyectoRepository.obtenerTodos(),
    ]);
    const trabajadorPorId = new Map(trabajadores.map((t) => [t.id, t]));
    const proyectoPorId = new Map(proyectos.map((p) => [p.id, p]));

    for (let i = 0; i < pendientes.length; i++) {
      const asistencia = pendientes[i];
      const trabajador = trabajadorPorId.get(asistencia.trabajadorId);
      const proyecto = proyectoPorId.get(asistencia.proyectoId);

      const payload: AsistenciaSyncPayload = {
        id: asistencia.id,
        trabajadorId: asistencia.trabajadorId,
        trabajadorNombre: trabajador?.nombreCompleto ?? "Trabajador desconocido",
        numeroEmpleado: trabajador?.numeroEmpleado ?? "—",
        proyectoId: asistencia.proyectoId,
        proyectoNombre: proyecto?.nombre ?? "Proyecto desconocido",
        tipoRegistro: asistencia.tipoRegistro,
        fechaHora: asistencia.fechaHora,
        fotoUri: asistencia.fotoUri,
        latitud: asistencia.latitud,
        longitud: asistencia.longitud,
      };

      try {
        await this.syncGateway.enviarAsistencia(payload);
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
