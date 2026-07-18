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
 */
export async function savePhoto(temporaryUri: string): Promise<SavedPhoto> {
  const photosDir = await ensurePhotosDirectory();

  const fileName = `photo_${Date.now()}.jpg`;
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
