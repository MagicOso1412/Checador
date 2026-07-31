import type { IReconocimientoFacialService } from "../../application/ports/IReconocimientoFacialService";

/**
 * Implementación por defecto de `IReconocimientoFacialService` mientras no
 * exista un motor real integrado — mismo criterio honesto que
 * `UnconfiguredSyncGateway`: falla claro en vez de fingir que detectó o
 * reconoció algo.
 *
 * **Librerías evaluadas para la implementación real** (investigado en julio
 * 2026, ver conversación con el usuario):
 * - Detección de rostro (fase 2): `expo-face-detector` está **deprecado**
 *   desde Expo SDK 51 (usaba Google Mobile Vision, descontinuado). La
 *   recomendación oficial de Expo hoy es `react-native-vision-camera` +
 *   `react-native-vision-camera-face-detector` (frame processor sobre
 *   ML Kit) o el plugin de ML Kit para vision-camera directamente.
 * - Reconocimiento/embeddings (fase 3): no hay paquete "todo incluido"
 *   maduro. El patrón usado en proyectos similares es
 *   `react-native-fast-tflite` cargando un modelo `.tflite` estilo FaceNet/
 *   MobileFaceNet, generando un vector de 128-512 floats por rostro, y
 *   comparando por similitud coseno (ver `application/services/similitudCoseno.ts`)
 *   contra los embeddings de las fotos de referencia de cada trabajador.
 *
 * **Por qué no se instalaron todavía:** ambas requieren módulos nativos con
 * frame processors (`react-native-worklets-core`, `react-native-reanimated`
 * en modo nativo), lo que rompe Expo Go y exige un dev client custom
 * (`expo-dev-client` + `eas build`, o build local con Android Studio/Xcode).
 * Este entorno de desarrollo no puede compilar ni probar módulos nativos
 * (ver la nota del crash de AsyncStorage y el bloqueo de `better-sqlite3` en
 * `hkc-backend`) — instalarlas aquí sería repetir ese riesgo sin poder
 * verificar que funcionan. Se necesita una build real (del usuario, fuera de
 * este entorno) antes de integrar la implementación real.
 */
export class NoOpReconocimientoFacialService implements IReconocimientoFacialService {
  async detectarRostro(_fotoUri: string): Promise<boolean> {
    throw new Error(
      "El reconocimiento facial todavía no está integrado (Sprint 5, fase 2 pendiente) — requiere una build nativa custom.",
    );
  }

  async generarEmbedding(_fotoUri: string): Promise<number[]> {
    throw new Error(
      "El reconocimiento facial todavía no está integrado (Sprint 5, fase 3 pendiente) — requiere una build nativa custom.",
    );
  }
}
