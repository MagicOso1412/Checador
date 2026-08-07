import { createImageFaceDetector } from "react-native-vision-camera-face-detector";

import type { IReconocimientoFacialService } from "../../application/ports/IReconocimientoFacialService";
import { NoOpReconocimientoFacialService } from "./NoOpReconocimientoFacialService";

/**
 * Detector creado una sola vez a nivel de módulo (no por llamada): crear un
 * `ImageFaceDetector` instancia un objeto nativo (Nitro `HybridObject`) del
 * lado Swift/Kotlin — mismo criterio que `getDatabase()` en
 * `database/db.ts`, un recurso costoso que se reutiliza, no se recrea en
 * cada `detectarRostro()`.
 *
 * `performanceMode: "accurate"` (no el `"fast"` por defecto): esto corre una
 * sola vez sobre una foto ya capturada, no en tiempo real sobre cada frame de
 * cámara — no hay presión de FPS aquí, así que no hay motivo para sacrificar
 * precisión por velocidad.
 */
const detector = createImageFaceDetector({ performanceMode: "accurate" });

/** `generarEmbedding()` delega aquí — ver el comentario de la clase. */
const noOp = new NoOpReconocimientoFacialService();

/**
 * Fase 2 de Sprint 5 (reconocimiento facial): implementación real de
 * `detectarRostro()` usando `react-native-vision-camera-face-detector`
 * (Google ML Kit por debajo). Reemplaza a `NoOpReconocimientoFacialService`
 * para este método — ver ese archivo para el detalle de por qué no se pudo
 * hacer antes (requiere el dev client nativo custom, ya generado).
 *
 * `generarEmbedding()` (fase 3, reconocimiento real por similitud) **sigue
 * sin implementación real** — esa fase necesita `react-native-fast-tflite` +
 * un modelo `.tflite` de embeddings faciales (MobileFaceNet o similar) que
 * todavía no se ha instalado ni evaluado. Delega a
 * `NoOpReconocimientoFacialService` para ese método en vez de duplicar el
 * mensaje de error aquí.
 */
export class VisionCameraReconocimientoFacialService implements IReconocimientoFacialService {
  async detectarRostro(fotoUri: string): Promise<boolean> {
    const rostros = detector.detectFaces(fotoUri);

    // Exactamente un rostro, no "al menos uno": una foto de referencia debe
    // ser de una sola persona. Si ML Kit detecta 2+ rostros (alguien pasó
    // detrás, un cartel con una cara, etc.) es tan inválida como si no
    // detectara ninguno — no hay forma honesta de saber cuál de los rostros
    // es el trabajador.
    return rostros.length === 1;
  }

  async generarEmbedding(fotoUri: string): Promise<number[]> {
    return noOp.generarEmbedding(fotoUri);
  }
}
