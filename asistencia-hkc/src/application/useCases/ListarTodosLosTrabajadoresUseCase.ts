import { Trabajador } from "../../domain/entities/Trabajador";
import type { ITrabajadorRepository } from "../../domain/repositories/ITrabajadorRepository";

/**
 * A diferencia de `ObtenerTrabajadoresUseCase` (solo activos, usado en el
 * flujo de identificación de asistencia), este use case es para la pantalla
 * de administración: necesita ver también los inactivos para poder
 * reactivarlos.
 */
export class ListarTodosLosTrabajadoresUseCase {
  constructor(private readonly trabajadorRepository: ITrabajadorRepository) {}

  async execute(): Promise<Trabajador[]> {
    return this.trabajadorRepository.obtenerTodos();
  }
}
