import { Proyecto } from "../entities/Proyecto";

export interface IProyectoRepository {
  /** Todos los proyectos, sin filtrar por estado. */
  obtenerTodos(): Promise<Proyecto[]>;

  /** Solo los proyectos activos (los que deben poder seleccionarse en la app). */
  obtenerActivos(): Promise<Proyecto[]>;
}
