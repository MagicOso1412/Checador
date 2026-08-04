import { ConsentimientoBiometrico } from "../../domain/entities/ConsentimientoBiometrico";
import type { IConsentimientoBiometricoRepository } from "../../domain/repositories/IConsentimientoBiometricoRepository";

export class ObtenerConsentimientoBiometricoUseCase {
  constructor(private readonly consentimientoRepository: IConsentimientoBiometricoRepository) {}

  async execute(trabajadorId: string): Promise<ConsentimientoBiometrico | null> {
    return this.consentimientoRepository.obtenerPorTrabajador(trabajadorId);
  }
}
