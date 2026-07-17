import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { XCircle } from "lucide-react-native";

import { palette } from "@/constants/palette";

export default function KioskErrorScreen() {
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (countdown <= 0) router.replace("/kiosco");
  }, [countdown]);

  return (
    <View className="flex-1 items-center justify-center bg-[#2a0a0a] px-6">
      <XCircle size={64} color="#f87171" />
      <Text className="mt-4 text-center text-xl font-bold text-white">
        No fue posible identificar al colaborador
      </Text>
      <Text className="mt-2 text-center text-sm" style={{ color: palette.white50 }}>
        Verifica la iluminación y que el rostro esté dentro del marco
      </Text>

      <Pressable
        onPress={() => router.replace("/kiosco")}
        className="mt-8 rounded-2xl bg-red-500 px-8 py-4"
        style={({ pressed }) => pressed && { opacity: 0.9 }}
      >
        <Text className="text-base font-semibold text-white">Intentar nuevamente</Text>
      </Pressable>

      <View className="mt-6 flex-row items-center gap-3">
        <View
          className="h-1.5 w-40 overflow-hidden rounded-full"
          style={{ backgroundColor: palette.white20 }}
        >
          <View
            className="h-full rounded-full bg-red-400"
            style={{ width: `${(countdown / 8) * 100}%` }}
          />
        </View>
        <Text className="text-sm" style={{ color: palette.white50 }}>
          {countdown}s
        </Text>
      </View>
      <Text className="mt-2 text-xs" style={{ color: palette.white30 }}>
        Regresando automáticamente…
      </Text>
    </View>
  );
}
