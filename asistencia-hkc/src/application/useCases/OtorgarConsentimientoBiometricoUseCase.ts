import { ConsentimientoBiometrico, VERSION_TEXTO_CONSENTIMIENTO_BIOMETRICO } from "../../domain/entities/ConsentimientoBiometrico";
import type { IConsentimientoBiometricoRepository } from "../../domain/repositories/IConsentimientoBiometricoRepository";

/**
 * Registra que un trabajador aceptó el uso de su rostro con fines de
 * identificación biométrica, bajo la versión actual del texto legal — nunca
 * bajo una versión que el caller decida, para que no sea posible otorgar
 * "consentimiento" para un texto que el trabajador nunca vio en pantalla.
 */
export class OtorgarConsentimientoBiometricoUseCase {
  constructor(private readonly consentimientoRepository: IConsentimientoBiometricoRepository) {}

  async execute(trabajadorId: string): Promise<ConsentimientoBiometrico> {
    return this.consentimientoRepository.otorgar(trabajadorId, VERSION_TEXTO_CONSENTIMIENTO_BIOMETRICO);
  }
}
