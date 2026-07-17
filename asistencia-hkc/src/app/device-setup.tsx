import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Download, Scan, Wifi } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { StatusPill } from "@/components/attendance/ui-rows";
import { palette } from "@/constants/palette";
import { shadowMd, shadowSm } from "@/constants/shadows";
import { useAttendance } from "@/context/attendance-context";

/**
 * Pantalla usada únicamente durante la instalación del dispositivo:
 * registro, código de activación / QR y modo de operación por defecto.
 */
export default function DeviceSetupScreen() {
  const { operationMode, setOperationMode } = useAttendance();
  const [code, setCode] = useState("");
  const connected = true;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Configuración Inicial"
        subtitle="Registro del dispositivo"
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 24, gap: 16 }}
      >
        <View className="gap-3 rounded-xl border border-border bg-card p-4" style={shadowSm}>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-foreground">
              Estado de conexión
            </Text>
            <StatusPill
              label={connected ? "Conectado" : "Sin conexión"}
              bgClassName={connected ? "bg-green-100" : "bg-red-100"}
              textClassName={connected ? "text-green-700" : "text-red-700"}
            />
          </View>
          <Text className="text-xs text-muted-foreground">
            Red: CorpWiFi_5G · Señal: Excelente
          </Text>
        </View>

        <View className="gap-3 rounded-xl border border-border bg-card p-4" style={shadowSm}>
          <Text className="text-sm font-semibold text-foreground">Código de activación</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 rounded-lg border border-border bg-input-background px-3 py-2.5 text-sm text-foreground"
              placeholder="Ingresa el código"
              placeholderTextColor={palette.mutedForeground}
              value={code}
              onChangeText={setCode}
            />
            <Pressable className="flex-row items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2.5">
              <Scan size={16} color={palette.primary} />
              <Text className="text-sm font-medium text-secondary-foreground">QR</Text>
            </Pressable>
          </View>
        </View>

        <View className="gap-3 rounded-xl border border-border bg-card p-4" style={shadowSm}>
          <Text className="text-sm font-semibold text-foreground">Modo de operación</Text>
          <View className="flex-row gap-2">
            {(["kiosco", "campo"] as const).map((mode) => {
              const active = operationMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setOperationMode(mode)}
                  className={`flex-1 rounded-xl border-2 p-3 ${
                    active ? "border-primary" : "border-border bg-muted"
                  }`}
                  style={active ? { backgroundColor: palette.primary10 } : undefined}
                >
                  <Text
                    className={`text-center text-sm font-medium ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {mode === "kiosco" ? "Modo Kiosco" : "Modo Campo"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-row items-center gap-1.5 self-start rounded-full bg-muted px-3 py-1.5">
          <Wifi size={12} color={palette.mutedForeground} />
          <Text className="text-xs text-muted-foreground">Configuración descargable</Text>
        </View>

        <Pressable
          onPress={() => router.replace("/mode-select")}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4"
          style={({ pressed }) => [shadowMd, pressed && { opacity: 0.9 }]}
        >
          <Download size={18} color={palette.white} />
          <Text className="text-base font-semibold text-primary-foreground">
            Descargar Configuración
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
