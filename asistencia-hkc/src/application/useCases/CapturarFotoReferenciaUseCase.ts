import { FotoReferenciaFacial } from "../../domain/entities/FotoReferenciaFacial";
import {
  MAXIMO_FOTOS_POR_TRABAJADOR,
  type IFotoReferenciaFacialRepository,
} from "../../domain/repositories/IFotoReferenciaFacialRepository";
import { generateId } from "../../utils/uuid";

export class LimiteFotosReferenciaError extends Error {
  constructor() {
    super(`Ya hay ${MAXIMO_FOTOS_POR_TRABAJADOR} fotos de referencia para este trabajador — elimina una antes de agregar otra.`);
    this.name = "LimiteFotosReferenciaError";
  }
}

/**
 * Registra una foto ya capturada y guardada en almacenamiento permanente
 * (`infrastructure/camera/cameraService.ts`, mismo flujo que la evidencia de
 * asistencia) como foto de referencia de un trabajador. Aplica el límite de
 * `MAXIMO_FOTOS_POR_TRABAJADOR` aquí (no en la UI ni en el repositorio) —
 * es una regla de negocio, vive en el use case.
 */
export class CapturarFotoReferenciaUseCase {
  constructor(private readonly fotoRepository: IFotoReferenciaFacialRepository) {}

  async execute(trabajadorId: string, fotoUri: string): Promise<FotoReferenciaFacial> {
    const total = await this.fotoRepository.contarPorTrabajador(trabajadorId);
    if (total >= MAXIMO_FOTOS_POR_TRABAJADOR) {
      throw new LimiteFotosReferenciaError();
    }

    const foto = new FotoReferenciaFacial(generateId(), trabajadorId, fotoUri, new Date());
    await this.fotoRepository.agregar(foto);
    return foto;
  }
}
