import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import { ensurePhotosDirectory } from "../storage/fileService";

export interface SavedPhoto {
  uri: string;
  fileName: string;
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
