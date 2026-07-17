import * as FileSystem from "expo-file-system/legacy";

export async function ensurePhotosDirectory() {

    const photosDir =
        `${FileSystem.documentDirectory}photos`;

    const info =
        await FileSystem.getInfoAsync(photosDir);

    if (!info.exists) {

        await FileSystem.makeDirectoryAsync(
            photosDir,
            {
                intermediates: true
            }
        );

    }

    return photosDir;
}