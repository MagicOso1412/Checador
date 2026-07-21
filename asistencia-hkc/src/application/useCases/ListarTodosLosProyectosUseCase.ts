import { Proyecto } from "../../domain/entities/Proyecto";
import type { IProyectoRepository } from "../../domain/repositories/IProyectoRepository";

/**
 * A diferencia de las lecturas de solo activos (usadas en la selección de
 * proyecto de Campo/Kiosco), este use case es para la pantalla de
 * administración: necesita ver también los inactivos para poder reactivarlos.
 */
export class ListarTodosLosProyectosUseCase {
  constructor(private readonly proyectoRepository: IProyectoRepository) {}

  async execute(): Promise<Proyecto[]> {
    return this.proyectoRepository.obtenerTodos();
  }
}
