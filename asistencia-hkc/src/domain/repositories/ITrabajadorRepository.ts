import { Trabajador } from "../entities/Trabajador";

export interface ITrabajadorRepository {
  obtenerTodos(): Promise<Trabajador[]>;
  obtenerActivos(): Promise<Trabajador[]>;
  buscarPorNumeroEmpleado(numeroEmpleado: string): Promise<Trabajador | null>;
  buscarPorId(id: string): Promise<Trabajador | null>;

  crear(trabajador: Trabajador): Promise<void>;
  actualizar(trabajador: Trabajador): Promise<void>;

  /**
   * Baja lógica (`activo = false`), nunca DELETE. Un trabajador puede tener
   * asistencias históricas asociadas (`asistencias.trabajador_id`) que deben
   * preservarse; además la FK (`PRAGMA foreign_keys = ON`) rechazaría un
   * DELETE si ya tiene registros. "Eliminar" en la UI significa "dejar de
   * mostrarlo como activo", no borrar su historial.
   */
  eliminar(id: string): Promise<void>;
}
