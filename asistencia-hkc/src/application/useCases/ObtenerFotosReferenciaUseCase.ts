import { FotoReferenciaFacial } from "../../domain/entities/FotoReferenciaFacial";
import type { IFotoReferenciaFacialRepository } from "../../domain/repositories/IFotoReferenciaFacialRepository";

export class ObtenerFotosReferenciaUseCase {
  constructor(private readonly fotoRepository: IFotoReferenciaFacialRepository) {}

  async execute(trabajadorId: string): Promise<FotoReferenciaFacial[]> {
    return this.fotoRepository.obtenerPorTrabajador(trabajadorId);
  }
}
