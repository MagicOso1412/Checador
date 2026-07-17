import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { UploadCloud } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { palette } from "@/constants/palette";
import { shadowMd, shadowSm } from "@/constants/shadows";

export default function SyncScreen() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSync = () => {
    setSyncing(true);
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setSyncing(false);
          return 100;
        }
        return p + 8;
      });
    }, 200);
  };

  const clamped = Math.min(progress, 100);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Sincronización" onBack={() => router.back()} className="bg-primary pb-4" />

      <View className="gap-4 p-4">
        <View className="gap-3 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">Registros pendientes</Text>
            <Text className="text-lg font-bold text-foreground">10</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">Errores encontrados</Text>
            <Text className="text-sm font-medium text-red-500">1</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">Última sincronización</Text>
            <Text className="text-sm font-medium text-foreground">Hoy 14:32</Text>
          </View>
        </View>

        <View className="rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-foreground">Progreso</Text>
            <Text className="text-sm text-muted-foreground">{clamped}%</Text>
          </View>
          <View className="h-3 overflow-hidden rounded-full bg-muted">
            <View
              className={`h-full rounded-full ${clamped >= 100 ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${clamped}%` }}
            />
          </View>
          {syncing ? (
            <Text className="mt-2 text-xs text-muted-foreground">
              Sincronizando registros…
            </Text>
          ) : null}
          {clamped >= 100 && !syncing ? (
            <Text className="mt-2 text-xs font-medium text-green-600">
              ✓ Sincronización completada
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={handleSync}
          disabled={syncing}
          className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
            syncing ? "bg-muted" : "bg-primary"
          }`}
          style={({ pressed }) => [!syncing && shadowMd, pressed && { opacity: 0.9 }]}
        >
          <UploadCloud size={20} color={syncing ? palette.mutedForeground : palette.white} />
          <Text
            className={`text-base font-semibold ${
              syncing ? "text-muted-foreground" : "text-primary-foreground"
            }`}
          >
            {syncing ? "Sincronizando…" : "Sincronizar ahora"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
