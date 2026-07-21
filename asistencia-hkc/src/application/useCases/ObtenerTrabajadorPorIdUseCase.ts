import { Trabajador } from "../../domain/entities/Trabajador";
import type { ITrabajadorRepository } from "../../domain/repositories/ITrabajadorRepository";

export class ObtenerTrabajadorPorIdUseCase {
  constructor(private readonly trabajadorRepository: ITrabajadorRepository) {}

  async execute(id: string): Promise<Trabajador | null> {
    return this.trabajadorRepository.buscarPorId(id);
  }
}
