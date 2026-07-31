/**
 * Puerto hacia el motor de reconocimiento facial (Sprint 5, fases 2-3 —
 * todavía sin implementación real). Vive en `application/ports/` (no
 * `domain/gateways/`, aprendiendo del error de capas ya documentado en
 * `ISyncGateway`): este puerto habla en términos de `fotoUri: string`, un
 * detalle de cómo el cliente guarda evidencia, no de una entidad de dominio
 * pura.
 *
 * **Por qué todavía no hay implementación real:** un motor real (ver
 * `NoOpReconocimientoFacialService.ts` para el detalle de librerías
 * evaluadas) requiere `react-native-vision-camera` +
 * `react-native-fast-tflite` (frame processors nativos) — módulos nativos
 * que no se pueden compilar ni probar en el entorno de desarrollo actual
 * (mismo tipo de limitación que ya causó el crash de AsyncStorage
 * documentado en este archivo, y que bloqueó compilar `better-sqlite3` en
 * `hkc-backend`). Instalarlos requiere un dev client custom (`eas build` o
 * build local con Android Studio/Xcode) que solo se puede compilar y probar
 * fuera de este entorno — por eso esta fase se detiene aquí hasta que el
 * usuario decida avanzar con esa build.
 */
export interface IReconocimientoFacialService {
  /**
   * ¿Hay un rostro detectable en esta foto? Pensado para validar una foto de
   * referencia recién capturada (fase 2: detección, más simple que
   * reconocimiento) antes de aceptarla.
   */
  detectarRostro(fotoUri: string): Promise<boolean>;

  /**
   * Vector de características (embedding) de un rostro, para comparar por
   * similitud contra otros embeddings (fase 3: reconocimiento real). La
   * dimensión del vector depende del modelo TFLite elegido (p. ej.
   * MobileFaceNet: 192; FaceNet: 128/512) — por eso no se tipa como una
   * tupla de longitud fija aquí.
   */
  generarEmbedding(fotoUri: string): Promise<number[]>;
}
