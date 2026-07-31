import type { IFotoReferenciaFacialRepository } from "../../domain/repositories/IFotoReferenciaFacialRepository";

/**
 * Solo borra el registro (`fotos_referencia_facial`) — no toca el archivo
 * físico. Ese es un detalle de infraestructura (`fileService.eliminarArchivo`)
 * que el use case no debe conocer; quien llame (el store) lo hace después,
 * mismo criterio que otros stores llaman infraestructura directamente para
 * side effects que no son reglas de negocio (ver `syncStore.ts`).
 */
export class EliminarFotoReferenciaUseCase {
  constructor(private readonly fotoRepository: IFotoReferenciaFacialRepository) {}

  async execute(id: string): Promise<void> {
    await this.fotoRepository.eliminar(id);
  }
}
