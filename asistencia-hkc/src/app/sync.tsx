import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { UploadCloud } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { palette } from "@/constants/palette";
import { shadowMd, shadowSm } from "@/constants/shadows";
import { useSyncStore } from "@/store/syncStore";

export default function SyncScreen() {
  const {
    pendientes,
    conError,
    cargando,
    sincronizando,
    progreso,
    ultimoResultado,
    ultimaSincronizacion,
    error,
    cargarEstado,
    sincronizar,
  } = useSyncStore();

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  const porcentaje =
    progreso && progreso.total > 0 ? Math.round((progreso.procesados / progreso.total) * 100) : 0;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Sincronización" onBack={() => router.back()} className="bg-primary pb-4" />

      <View className="gap-4 p-4">
        <View className="gap-3 rounded-2xl border border-border bg-card p-4" style={shadowSm}>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">Registros pendientes</Text>
            <Text className="text-lg font-bold text-foreground">{cargando ? "…" : pendientes}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">Con error</Text>
            <Text className="text-sm font-medium text-red-500">{cargando ? "…" : conError}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">Última sincronización</Text>
            <Text className="text-sm font-medium text-foreground">
              {ultimaSincronizacion
                ? ultimaSincronizacion.toLocaleString("es-MX", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "Nunca"}
            </Text>
          </View>
        </View>

        {sincronizando ? (
          <View className="rounded-2xl border border-border bg-card p-4" style={shadowSm}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">Progreso</Text>
              <Text className="text-sm text-muted-foreground">
                {progreso ? `${progreso.procesados}/${progreso.total}` : "…"}
              </Text>
            </View>
            <View className="h-3 overflow-hidden rounded-full bg-muted">
              <View className="h-full rounded-full bg-primary" style={{ width: `${porcentaje}%` }} />
            </View>
            <Text className="mt-2 text-xs text-muted-foreground">Sincronizando registros…</Text>
          </View>
        ) : ultimoResultado ? (
          <View className="rounded-2xl border border-border bg-card p-4" style={shadowSm}>
            <Text className="text-sm font-semibold text-foreground">Última corrida</Text>
            <Text className="mt-1 text-xs text-green-600">
              {ultimoResultado.exitosos} sincronizado(s) correctamente
            </Text>
            {ultimoResultado.fallidos > 0 ? (
              <Text className="mt-1 text-xs text-red-500">
                {ultimoResultado.fallidos} con error — {ultimoResultado.errores[0]?.mensaje}
              </Text>
            ) : null}
          </View>
        ) : null}

        {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}

        <Pressable
          onPress={sincronizar}
          disabled={sincronizando || cargando || pendientes === 0}
          className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
            sincronizando || pendientes === 0 ? "bg-muted" : "bg-primary"
          }`}
          style={({ pressed }) => [!sincronizando && pendientes > 0 && shadowMd, pressed && { opacity: 0.9 }]}
        >
          {sincronizando ? (
            <ActivityIndicator size="small" color={palette.mutedForeground} />
          ) : (
            <UploadCloud size={20} color={pendientes === 0 ? palette.mutedForeground : palette.white} />
          )}
          <Text
            className={`text-base font-semibold ${
              sincronizando || pendientes === 0 ? "text-muted-foreground" : "text-primary-foreground"
            }`}
          >
            {sincronizando
              ? "Sincronizando…"
              : pendientes === 0
                ? "Sin registros pendientes"
                : "Sincronizar ahora"}
          </Text>
        </Pressable>

        <Text className="text-center text-xs text-muted-foreground">
          Sin backend de sincronización configurado todavía (Sprint 4): los intentos quedarán marcados
          con error hasta que exista un servidor real.
        </Text>
      </View>
    </View>
  );
}
