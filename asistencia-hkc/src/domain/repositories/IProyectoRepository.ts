import { Proyecto } from "../entities/Proyecto";

export interface IProyectoRepository {
  /** Todos los proyectos, sin filtrar por estado. */
  obtenerTodos(): Promise<Proyecto[]>;

  /** Solo los proyectos activos (los que deben poder seleccionarse en la app). */
  obtenerActivos(): Promise<Proyecto[]>;

  buscarPorId(id: string): Promise<Proyecto | null>;
  buscarPorNombre(nombre: string): Promise<Proyecto | null>;

  crear(proyecto: Proyecto): Promise<void>;
  actualizar(proyecto: Proyecto): Promise<void>;

  /**
   * Baja lógica (`activo = false`), nunca DELETE — mismo motivo que
   * `ITrabajadorRepository.eliminar()`: un proyecto puede tener asistencias
   * asociadas (`asistencias.proyecto_id`) que deben preservarse, y la FK
   * (`PRAGMA foreign_keys = ON`) rechazaría el DELETE si ya tiene registros.
   */
  eliminar(id: string): Promise<void>;
}
