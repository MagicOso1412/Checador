import { Proyecto } from "../../domain/entities/Proyecto";
import type { IProyectoRepository } from "../../domain/repositories/IProyectoRepository";

/**
 * Obtiene los proyectos disponibles para seleccionar en la app (solo activos).
 * La UI nunca debe consultar SQLite directamente: siempre pasa por este use case.
 */
export class ObtenerProyectosUseCase {
  constructor(private readonly proyectoRepository: IProyectoRepository) {}

  async execute(): Promise<Proyecto[]> {
    return this.proyectoRepository.obtenerActivos();
  }
}
