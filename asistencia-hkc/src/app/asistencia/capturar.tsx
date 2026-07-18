import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import CameraCapture from "@/components/CameraCapture";
import { palette } from "@/constants/palette";
import type { SavedPhoto } from "@/infrastructure/camera/cameraService";
import { useRegistroAsistenciaStore } from "@/store/registroAsistenciaStore";

/** Paso 2 del registro: fotografía de evidencia del trabajador ya identificado. */
export default function CapturarFotoScreen() {
  const trabajadorSeleccionado = useRegistroAsistenciaStore((state) => state.trabajadorSeleccionado);
  const setFoto = useRegistroAsistenciaStore((state) => state.setFoto);

  // Esta pantalla depende de que ya se haya identificado a un trabajador
  // (paso anterior). Si se llega aquí sin uno, no hay nada que fotografiar.
  useEffect(() => {
    if (!trabajadorSeleccionado) {
      router.replace("/asistencia");
    }
  }, [trabajadorSeleccionado]);

  if (!trabajadorSeleccionado) {
    return <View className="flex-1 bg-[#06080f]" />;
  }

  const handleCaptured = (photo: SavedPhoto) => {
    setFoto(photo.uri);
    router.push("/asistencia/confirmar");
  };

  return (
    <View className="flex-1 bg-[#06080f]">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-14">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={20} color={palette.white50} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-white">Captura de Evidencia</Text>
          <Text className="text-xs" style={{ color: palette.white50 }}>
            {trabajadorSeleccionado.nombreCompleto}
          </Text>
        </View>
      </View>

      <CameraCapture onCaptured={handleCaptured} />
    </View>
  );
}
