import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, User } from "lucide-react-native";

import { PulsingRing } from "@/components/attendance/pulse";
import { palette } from "@/constants/palette";
import { useProyectoStore } from "@/store/proyectoStore";

const QUALITY_COLOR = {
  good: "#4ade80",
  ok: "#fbbf24",
  bad: "#f87171",
} as const;

/** Pantalla dedicada a la captura biométrica (reconocimiento facial). */
export default function CameraCaptureScreen() {
  const proyectoSeleccionado = useProyectoStore((state) => state.proyectoSeleccionado);
  const [scanning, setScanning] = useState(false);
  const [quality, setQuality] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setQuality((q) => Math.min(100, q + Math.random() * 15)), 300);
    return () => clearInterval(id);
  }, []);

  const handleCapture = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      router.push("/asistencia/confirmar");
    }, 1800);
  };

  const qualityColor = quality > 70 ? QUALITY_COLOR.good : quality > 40 ? QUALITY_COLOR.ok : QUALITY_COLOR.bad;
  const qualityLabel = quality > 70 ? "Buena" : quality > 40 ? "Regular" : "Baja";

  return (
    <View className="flex-1 bg-[#06080f]">
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-14">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={20} color={palette.white50} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-white">Captura Biométrica</Text>
          <Text className="text-xs" style={{ color: palette.white50 }}>
            {proyectoSeleccionado?.nombre ?? "Sin proyecto seleccionado"}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: qualityColor }} />
          <Text className="text-xs" style={{ color: palette.white60 }}>
            Calidad: {qualityLabel}
          </Text>
        </View>
      </View>

      <View className="mx-4 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[#0d1117]">
        <View
          className="items-center justify-center"
          style={scanning ? { transform: [{ scale: 1.05 }] } : undefined}
        >
          <View
            className="h-60 w-48 items-center justify-center rounded-full border-2"
            style={{ borderColor: scanning ? "#4ade80" : palette.white30 }}
          >
            {scanning ? (
              <PulsingRing color={QUALITY_COLOR.good} borderRadius={9999} />
            ) : null}
            <User size={72} color={scanning ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"} />
          </View>
        </View>

        <View
          className="absolute inset-x-8 bottom-4 h-1 overflow-hidden rounded-full"
          style={{ backgroundColor: palette.white10 }}
        >
          <View
            className="h-full rounded-full"
            style={{ width: `${quality}%`, backgroundColor: qualityColor }}
          />
        </View>
      </View>

      <View className="gap-3 px-4 py-5">
        <Text className="text-center text-sm" style={{ color: palette.white60 }}>
          {scanning ? "Procesando…" : "Mantén el rostro dentro del marco"}
        </Text>
        <Pressable
          onPress={handleCapture}
          disabled={scanning}
          className="items-center rounded-2xl py-4"
          style={({ pressed }) => [
            { backgroundColor: scanning ? palette.white10 : palette.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text
            className="text-base font-semibold"
            style={{ color: scanning ? palette.white40 : palette.white }}
          >
            {scanning ? "Analizando rostro…" : "Capturar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
