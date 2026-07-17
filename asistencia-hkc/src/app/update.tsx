import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Download } from "lucide-react-native";

import { palette } from "@/constants/palette";

const NOVEDADES = [
  "Reconocimiento facial más rápido",
  "Soporte para modo offline mejorado",
  "Corrección de errores de sincronización",
  "Nuevos informes de asistencia",
];

export default function UpdateScreen() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleUpdate = () => {
    setDownloading(true);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        return p + 5;
      });
    }, 150);
  };

  const clamped = Math.min(progress, 100);

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View
        className="mb-5 h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: palette.primary10 }}
      >
        <Download size={36} color={palette.primary} />
      </View>
      <Text className="text-center text-2xl font-bold text-foreground">
        Nueva versión disponible
      </Text>
      <Text className="mt-1 text-sm text-muted-foreground">
        v1.1.0 · Mejoras de rendimiento
      </Text>

      <View className="mt-5 w-full max-w-xs gap-2 rounded-2xl border border-border bg-card p-4">
        <Text className="text-sm font-semibold text-foreground">¿Qué hay de nuevo?</Text>
        {NOVEDADES.map((item) => (
          <Text key={item} className="text-xs text-muted-foreground">
            • {item}
          </Text>
        ))}
      </View>

      {downloading ? (
        <View className="mt-4 w-full max-w-xs">
          <View className="mb-1 flex-row justify-between">
            <Text className="text-xs text-muted-foreground">Descargando…</Text>
            <Text className="text-xs text-muted-foreground">{clamped}%</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-muted">
            <View
              className={`h-full rounded-full ${clamped >= 100 ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${clamped}%` }}
            />
          </View>
          {clamped >= 100 ? (
            <Text className="mt-2 text-center text-xs font-medium text-green-600">
              ✓ Descarga completada
            </Text>
          ) : null}
        </View>
      ) : (
        <Pressable
          onPress={handleUpdate}
          className="mt-6 flex-row items-center gap-2 rounded-2xl bg-primary px-10 py-4"
          style={({ pressed }) => pressed && { opacity: 0.9 }}
        >
          <Download size={18} color={palette.white} />
          <Text className="text-base font-semibold text-white">Actualizar ahora</Text>
        </Pressable>
      )}

      <Pressable onPress={() => router.back()} className="mt-3">
        <Text className="text-sm text-muted-foreground">Recordar más tarde</Text>
      </Pressable>
    </View>
  );
}
