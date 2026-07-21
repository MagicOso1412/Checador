import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import CameraCapture from "@/components/CameraCapture";
import { palette } from "@/constants/palette";
import type { SavedPhoto } from "@/infrastructure/camera/cameraService";
import { useProyectoStore } from "@/store/proyectoStore";
import { useRegistroAsistenciaStore } from "@/store/registroAsistenciaStore";

/**
 * Captura de foto. Se llega aquí de dos formas distintas según el modo (ver
 * ARCHITECTURE.md):
 * - Campo: después de elegir trabajador (`asistencia/index.tsx`) — ya se
 *   sabe quién es, esta pantalla solo toma la evidencia.
 * - Kiosco: directo desde `/kiosco` ("reconocimiento facial"), todavía sin
 *   trabajador identificado. Como no existe reconocimiento facial real
 *   todavía (Sprint 5), tras la foto se pide identificarlo — pero eso pasa
 *   DESPUÉS de la cámara, no antes.
 * Por eso esta pantalla no exige un trabajador ya elegido: solo decide a
 * dónde seguir según lo que ya esté en el borrador (`registroAsistenciaStore`).
 */
export default function CapturarFotoScreen() {
  const trabajadorSeleccionado = useRegistroAsistenciaStore((state) => state.trabajadorSeleccionado);
  const setFoto = useRegistroAsistenciaStore((state) => state.setFoto);
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);

  const handleCaptured = (photo: SavedPhoto) => {
    setFoto(photo.uri);
    router.push(trabajadorSeleccionado ? "/asistencia/confirmar" : "/asistencia");
  };

  return (
    <View className="flex-1 bg-[#06080f]">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-14">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={20} color={palette.white50} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-white">
            {trabajadorSeleccionado ? "Captura de Evidencia" : "Reconocimiento Facial"}
          </Text>
          <Text className="text-xs" style={{ color: palette.white50 }}>
            {trabajadorSeleccionado?.nombreCompleto ?? proyectoSeleccionado?.nombre ?? ""}
          </Text>
        </View>
      </View>

      <CameraCapture onCaptured={handleCaptured} />
    </View>
  );
}
