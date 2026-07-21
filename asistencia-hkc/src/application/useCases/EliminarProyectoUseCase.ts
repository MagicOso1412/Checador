import type { IProyectoRepository } from "../../domain/repositories/IProyectoRepository";

/** Baja lógica — ver la nota en IProyectoRepository.eliminar() sobre por qué no es un DELETE real. */
export class EliminarProyectoUseCase {
  constructor(private readonly proyectoRepository: IProyectoRepository) {}

  async execute(id: string): Promise<void> {
    const existente = await this.proyectoRepository.buscarPorId(id);
    if (!existente) {
      throw new Error("El proyecto que intentas eliminar ya no existe");
    }
    await this.proyectoRepository.eliminar(id);
  }
}
