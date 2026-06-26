import * as FileSystem from "expo-file-system/legacy";
import { ensurePhotosDirectory } from "./fileService";

export async function savePhoto(
    temporaryUri: string
) {

    const photosDir =
        await ensurePhotosDirectory();

    const fileName =
        `photo_${Date.now()}.jpg`;

    const destination =
        `${photosDir}/${fileName}`;

    await FileSystem.copyAsync({
        from: temporaryUri,
        to: destination,
    });

    return {
        uri: destination,
        fileName,
    };
}