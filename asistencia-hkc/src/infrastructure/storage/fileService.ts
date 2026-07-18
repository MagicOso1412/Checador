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
 */
export async function ensurePhotosDirectory(): Promise<string> {
  const photosDir = `${FileSystem.documentDirectory}photos`;

  const info = await FileSystem.getInfoAsync(photosDir);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
  }

  return photosDir;
}
