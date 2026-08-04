/**
 * Versión vigente del texto de consentimiento biométrico (ver
 * `constants/consentimientoBiometrico.ts` para el texto real). Cambia este
 * valor cada vez que el texto legal cambie de forma relevante — un
 * consentimiento otorgado bajo una versión anterior deja de contar como
 * vigente (`ConsentimientoBiometrico.cubreVersionActual`) y se vuelve a pedir,
 * mismo criterio que un "aviso de privacidad" que se re-notifica cuando
 * cambia. No cambiar por typos o wording menor, solo por cambios de fondo
 * (qué se captura, para qué, dónde vive el dato).
 */
export const VERSION_TEXTO_CONSENTIMIENTO_BIOMETRICO = "2026-08-v1";

/**
 * Consentimiento explícito de un trabajador para el uso de su rostro con
 * fines de identificación biométrica (Sprint 5: fotos de referencia +
 * futuro reconocimiento facial). Requerido por la LFPDPPP mexicana: el
 * rostro/plantilla biométrica es un dato personal sensible, no basta con el
 * consentimiento tácito que aplica a datos personales comunes.
 *
 * Una sola fila por trabajador (`trabajadorId` es la PK en la tabla) — no un
 * historial de consentimientos. `otorgar()` en el repositorio hace upsert:
 * volver a aceptar (tras revocar, o tras un cambio de versión del texto)
 * simplemente reemplaza la fila con la fecha y versión nuevas.
 *
 * No tiene `id` propio a propósito, a diferencia de `FotoReferenciaFacial` —
 * aquí `trabajadorId` ya es identificador único suficiente, no hace falta un
 * UUID adicional para una relación 1 a 1.
 */
export class ConsentimientoBiometrico {
  constructor(
    public readonly trabajadorId: string,
    public readonly versionTexto: string,
    public readonly aceptadoEn: Date,
    public readonly revocadoEn: Date | null,
  ) {}

  /** `false` si el trabajador lo revocó explícitamente (derecho de cancelación, LFPDPPP). */
  get vigente(): boolean {
    return this.revocadoEn === null;
  }

  /**
   * `true` solo si está vigente Y corresponde a la versión actual del texto.
   * Esta es la comprobación real que debe usar la UI antes de permitir
   * capturar fotos de referencia — combina "no lo revocó" y "no cambió el
   * texto desde que aceptó" en un solo lugar para que ningún caller se
   * olvide de una de las dos condiciones.
   */
  get cubreVersionActual(): boolean {
    return this.vigente && this.versionTexto === VERSION_TEXTO_CONSENTIMIENTO_BIOMETRICO;
  }
}
