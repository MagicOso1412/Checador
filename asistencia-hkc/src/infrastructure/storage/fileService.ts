import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

/**
 * Adaptador de almacenamiento local de archivos (evidencia fotográfica).
 * Usa `expo-file-system/legacy` por compatibilidad con Expo SDK 56 (la API
 * nueva de `expo-file-system` todavía no es la recomendada en este SDK).
 *
 * Vive en `infrastructure/storage/` porque es un detalle de implementación
 * de "dónde y cómo se guardan los archivos en este dispositivo" — el dominio
 * y los use cases nunca importan `expo-file-system` directamente, solo
 * conocen `fotoUri: string`.
 *
 * Solo tiene sentido en nativo: `expo-file-system/legacy` no está disponible
 * en web (no hay filesystem real). `infrastructure/camera/cameraService.ts`
 * ya evita llamar esta función en web; el guard de abajo es solo defensivo
 * por si algo más la invoca ahí en el futuro.
 */
export async function ensurePhotosDirectory(): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error("ensurePhotosDirectory no está disponible en web (no hay filesystem real)");
  }

  const photosDir = `${FileSystem.documentDirectory}photos`;

  const info = await FileSystem.getInfoAsync(photosDir);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
  }

  return photosDir;
}
