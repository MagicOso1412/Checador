import { Proyecto } from "../../domain/entities/Proyecto";
import type { IProyectoRepository } from "../../domain/repositories/IProyectoRepository";

export class ObtenerProyectoPorIdUseCase {
  constructor(private readonly proyectoRepository: IProyectoRepository) {}

  async execute(id: string): Promise<Proyecto | null> {
    return this.proyectoRepository.buscarPorId(id);
  }
}
