import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { Camera } from "expo-camera";

import { ensurePhotosDirectory } from "../storage/fileService";

export interface SavedPhoto {
  uri: string;
  fileName: string;
}

/**
 * Consulta si el permiso de cámara ya está concedido, sin pedirlo (a
 * diferencia de `useCameraPermissions()` de `CameraCapture.tsx`, que sí lo
 * solicita). Pensado para pantallas de estado/diagnóstico (`admin.tsx`) que
 * solo necesitan mostrar si la cámara está disponible, no abrirla.
 */
export async function verificarPermisoCamara(): Promise<boolean> {
  try {
    const { status } = await Camera.getCameraPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.warn("[cameraService] no se pudo verificar el permiso de cámara", error);
    return false;
  }
}

/**
 * Copia la foto temporal que devuelve `CameraView.takePictureAsync()` hacia
 * el directorio permanente de evidencia (`infrastructure/storage`). La UI
 * solo debe llamar a `savePhoto`, nunca tocar `expo-file-system` ni rutas de
 * archivo directamente.
 *
 * En web no hay sistema de archivos real: `expo-file-system/legacy`
 * (`documentDirectory`, `getInfoAsync`, etc.) no está disponible ahí y lanza
 * "not available on web". Pero tampoco hace falta — `takePictureAsync()` en
 * web ya devuelve una `data:` URI autocontenida (ver
 * `expo-camera/src/web/WebCameraUtils.ts`, usa `canvas.toDataURL()`), lista
 * para usarse directamente como `uri` de un `<Image>`. Así que en web no se
 * "copia a almacenamiento permanente": la propia URI ya lo es (vive en
 * memoria/el DOM, no persiste entre recargas de página — ver la nota de
 * soporte Web en ARCHITECTURE.md, el foco ahí es desarrollo/demo).
 */
/**
 * Chequeo de sanidad, no de contenido: confirma que el archivo guardado
 * exista y no esté vacío (0 bytes) — cubre el caso raro de un glitch de la
 * cámara que produce un archivo corrupto/truncado. **No detecta si hay un
 * rostro en la foto** — eso requiere el motor de reconocimiento real, ver
 * `application/ports/IReconocimientoFacialService.ts` y la nota de por qué
 * no está integrado todavía. En web siempre es válido: la "foto" es una
 * `data:` URI en memoria, no un archivo con tamaño consultable.
 */
export async function esArchivoDeFotoValido(uri: string): Promise<boolean> {
  if (Platform.OS === "web") return true;

  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && info.size > 0;
  } catch (error) {
    console.warn("[cameraService] no se pudo verificar el archivo de foto", error);
    return false;
  }
}

export async function savePhoto(temporaryUri: string): Promise<SavedPhoto> {
  const fileName = `photo_${Date.now()}.jpg`;

  if (Platform.OS === "web") {
    return { uri: temporaryUri, fileName };
  }

  const photosDir = await ensurePhotosDirectory();
  const destination = `${photosDir}/${fileName}`;

  await FileSystem.copyAsync({
    from: temporaryUri,
    to: destination,
  });

  return {
    uri: destination,
    fileName,
  };
}
