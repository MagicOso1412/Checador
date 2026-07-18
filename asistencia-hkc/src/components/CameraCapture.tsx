import { useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { CameraView, type CameraType, useCameraPermissions } from "expo-camera";
import { Camera, RefreshCw } from "lucide-react-native";

import { palette } from "@/constants/palette";
import { savePhoto, type SavedPhoto } from "@/infrastructure/camera/cameraService";

type Props = {
  /** Cámara a usar. "front" por defecto: es una foto de evidencia del propio trabajador. */
  facing?: CameraType;
  /** Se llama con la foto ya copiada a almacenamiento permanente (infrastructure/storage). */
  onCaptured: (photo: SavedPhoto) => void;
};

/**
 * Componente reutilizable de captura de foto de evidencia. No sabe nada de
 * asistencias/trabajadores/proyectos — solo pide permiso de cámara, muestra
 * el visor, toma la foto y la persiste vía `infrastructure/camera`. Quien lo
 * use decide qué hacer con la `SavedPhoto` resultante (`onCaptured`).
 */
export default function CameraCapture({ facing = "front", onCaptured }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-[#06080f]">
        <ActivityIndicator color={palette.white} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-[#06080f] px-8">
        <Camera size={40} color={palette.white50} />
        <Text className="text-center text-sm" style={{ color: palette.white70 }}>
          Se necesita acceso a la cámara para capturar la evidencia de asistencia
        </Text>
        <Pressable
          onPress={requestPermission}
          className="rounded-xl bg-primary px-5 py-2.5"
          style={({ pressed }) => pressed && { opacity: 0.9 }}
        >
          <Text className="text-sm font-semibold text-white">Permitir cámara</Text>
        </Pressable>
      </View>
    );
  }

  async function capturePhoto() {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) throw new Error("La cámara no devolvió ninguna foto");

      const saved = await savePhoto(photo.uri);
      setPreviewUri(saved.uri);
      onCaptured(saved);
    } catch (error) {
      console.error("[CameraCapture] error al capturar foto", error);
    } finally {
      setCapturing(false);
    }
  }

  function retake() {
    setPreviewUri(null);
  }

  return (
    <View className="flex-1 bg-[#06080f]">
      <View className="mx-4 mt-4 flex-1 overflow-hidden rounded-2xl bg-[#0d1117]">
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={{ width: "100%", height: "100%" }} />
        ) : (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />
        )}
      </View>

      <View className="gap-3 px-4 py-5">
        {previewUri ? (
          <Pressable
            onPress={retake}
            className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
            style={({ pressed }) => [
              { backgroundColor: palette.white10 },
              pressed && { opacity: 0.9 },
            ]}
          >
            <RefreshCw size={18} color={palette.white} />
            <Text className="text-base font-semibold text-white">Repetir foto</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={capturePhoto}
            disabled={capturing}
            className="items-center rounded-2xl py-4"
            style={({ pressed }) => [
              { backgroundColor: capturing ? palette.white10 : palette.primary },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              className="text-base font-semibold"
              style={{ color: capturing ? palette.white40 : palette.white }}
            >
              {capturing ? "Guardando…" : "Capturar"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
