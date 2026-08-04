import type { FotoReferenciaFacial } from "../../domain/entities/FotoReferenciaFacial";
import type { IConsentimientoBiometricoRepository } from "../../domain/repositories/IConsentimientoBiometricoRepository";
import type { IFotoReferenciaFacialRepository } from "../../domain/repositories/IFotoReferenciaFacialRepository";

/**
 * Derecho de cancelación (LFPDPPP): revocar el consentimiento no solo cierra
 * la puerta a capturar fotos nuevas, también borra las que ya existían — un
 * "revoco mi consentimiento" que dejara el dato biométrico guardado no sería
 * una revocación real. A diferencia de `EliminarFotoReferenciaUseCase` (borra
 * una foto suelta a petición del usuario), aquí se borran todas las fotos del
 * trabajador como consecuencia de la revocación.
 *
 * Mismo criterio que el resto de los use cases de fotos: solo orquesta los
 * repositorios (borra las filas, marca revocado); borrar los archivos físicos
 * es un side effect de infraestructura que le toca al store, por eso este
 * método regresa las fotos borradas — el store las usa para limpiar el
 * almacenamiento (best-effort, mismo patrón que `fotosReferenciaStore.eliminarFoto`).
 */
export class RevocarConsentimientoBiometricoUseCase {
  constructor(
    private readonly consentimientoRepository: IConsentimientoBiometricoRepository,
    private readonly fotoRepository: IFotoReferenciaFacialRepository,
  ) {}

  async execute(trabajadorId: string): Promise<FotoReferenciaFacial[]> {
    const fotos = await this.fotoRepository.obtenerPorTrabajador(trabajadorId);

    for (const foto of fotos) {
      await this.fotoRepository.eliminar(foto.id);
    }

    await this.consentimientoRepository.revocar(trabajadorId);

    return fotos;
  }
}
