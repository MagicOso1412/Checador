import { Trabajador } from "../../domain/entities/Trabajador";
import type { ITrabajadorRepository } from "../../domain/repositories/ITrabajadorRepository";

export class ObtenerTrabajadoresUseCase {
  constructor(private readonly trabajadorRepository: ITrabajadorRepository) {}

  async execute(): Promise<Trabajador[]> {
    return this.trabajadorRepository.obtenerActivos();
  }
}
