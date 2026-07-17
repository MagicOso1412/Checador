import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { WifiOff } from "lucide-react-native";

import { DetailRow } from "@/components/attendance/ui-rows";

export default function OfflineScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-amber-100">
        <WifiOff size={36} color="#f59e0b" />
      </View>
      <Text className="text-center text-2xl font-bold text-foreground">
        Trabajando sin conexión
      </Text>
      <Text className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
        La información permanecerá almacenada localmente en el dispositivo hasta recuperar la
        conexión a Internet.
      </Text>

      <View className="mt-6 w-full max-w-xs gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <DetailRow label="Registros guardados" value="10" />
        <DetailRow label="Pendientes de sync" value="10" />
        <DetailRow label="Capacidad restante" value="13.9 GB" />
      </View>

      <Pressable
        onPress={() => router.back()}
        className="mt-6 rounded-2xl bg-primary px-8 py-3.5"
        style={({ pressed }) => pressed && { opacity: 0.9 }}
      >
        <Text className="font-semibold text-primary-foreground">Continuar sin conexión</Text>
      </Pressable>
    </View>
  );
}
