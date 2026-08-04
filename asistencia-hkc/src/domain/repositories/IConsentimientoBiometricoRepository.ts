import { ConsentimientoBiometrico } from "../entities/ConsentimientoBiometrico";

export interface IConsentimientoBiometricoRepository {
  /** `null` si el trabajador nunca ha otorgado consentimiento. */
  obtenerPorTrabajador(trabajadorId: string): Promise<ConsentimientoBiometrico | null>;

  /**
   * Upsert: crea el consentimiento o, si ya existía (aceptación previa o
   * revocada), lo reemplaza con la fecha y versión actuales y limpia
   * `revocadoEn`. Un trabajador que había revocado y vuelve a aceptar queda
   * vigente de nuevo sin dejar un rastro de "revocado" a medias.
   */
  otorgar(trabajadorId: string, versionTexto: string): Promise<ConsentimientoBiometrico>;

  /** Marca `revocadoEn = ahora`. No borra la fila — conserva cuándo y bajo qué versión había aceptado antes. */
  revocar(trabajadorId: string): Promise<void>;
}
