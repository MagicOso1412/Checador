import type { ITrabajadorRepository } from "../../domain/repositories/ITrabajadorRepository";

/** Baja lógica — ver la nota en ITrabajadorRepository.eliminar() sobre por qué no es un DELETE real. */
export class EliminarTrabajadorUseCase {
  constructor(private readonly trabajadorRepository: ITrabajadorRepository) {}

  async execute(id: string): Promise<void> {
    const existente = await this.trabajadorRepository.buscarPorId(id);
    if (!existente) {
      throw new Error("El trabajador que intentas eliminar ya no existe");
    }
    await this.trabajadorRepository.eliminar(id);
  }
}
