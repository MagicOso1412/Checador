import type { HistorialAsistenciaDTO } from "../dto/HistorialAsistenciaDTO";
import type { IAsistenciaRepository } from "../../domain/repositories/IAsistenciaRepository";
import type { IProyectoRepository } from "../../domain/repositories/IProyectoRepository";
import type { ITrabajadorRepository } from "../../domain/repositories/ITrabajadorRepository";

/**
 * Arma el historial local combinando asistencias con los nombres de
 * trabajador y proyecto (join en memoria, no en SQL): las tablas de
 * trabajadores/proyectos son pequeñas y locales, así que traerlas completas
 * y cruzarlas aquí es más barato que complicar el repositorio con un join
 * SQL atado a la forma de un DTO de otra capa. Si trabajador/proyecto no se
 * encuentran (registro huérfano, dato borrado), se degrada a "Desconocido"
 * en vez de fallar — el historial nunca debe romperse por un dato faltante.
 */
export class ObtenerHistorialUseCase {
  constructor(
    private readonly asistenciaRepository: IAsistenciaRepository,
    private readonly trabajadorRepository: ITrabajadorRepository,
    private readonly proyectoRepository: IProyectoRepository,
  ) {}

  async execute(proyectoId?: string, limite?: number): Promise<HistorialAsistenciaDTO[]> {
    const [asistencias, trabajadores, proyectos] = await Promise.all([
      this.asistenciaRepository.obtenerPorProyecto(proyectoId, limite),
      this.trabajadorRepository.obtenerTodos(),
      this.proyectoRepository.obtenerTodos(),
    ]);

    const trabajadorPorId = new Map(trabajadores.map((t) => [t.id, t]));
    const proyectoPorId = new Map(proyectos.map((p) => [p.id, p]));

    return asistencias.map((asistencia) => {
      const trabajador = trabajadorPorId.get(asistencia.trabajadorId);
      const proyecto = proyectoPorId.get(asistencia.proyectoId);

      return {
        id: asistencia.id,
        trabajadorNombre: trabajador?.nombreCompleto ?? "Trabajador desconocido",
        numeroEmpleado: trabajador?.numeroEmpleado ?? "—",
        proyectoNombre: proyecto?.nombre ?? "Proyecto desconocido",
        tipoRegistro: asistencia.tipoRegistro,
        fechaHora: asistencia.fechaHora,
        fotoUri: asistencia.fotoUri,
        sincronizado: asistencia.sincronizado,
      };
    });
  }
}
