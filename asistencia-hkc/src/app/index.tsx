import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { ClipboardList } from "lucide-react-native";

import { palette } from "@/constants/palette";

const STEPS = [
  { label: "Verificando configuración…", pct: 30 },
  { label: "Comprobando sincronización pendiente…", pct: 60 },
  { label: "Conectando al servidor…", pct: 85 },
  { label: "Listo", pct: 100 },
];

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(STEPS[0].label);

  useEffect(() => {
    let i = 0;
    const tick = () => {
      if (i < STEPS.length) {
        setStep(STEPS[i].label);
        setProgress(STEPS[i].pct);
        i++;
        setTimeout(tick, 650);
      } else {
        setTimeout(() => router.replace("/mode-select"), 400);
      }
    };
    const start = setTimeout(tick, 400);
    return () => clearTimeout(start);
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-primary px-8">
      <View className="mb-8 items-center">
        <View
          className="mb-4 h-20 w-20 items-center justify-center rounded-2xl"
          style={{ backgroundColor: palette.white20 }}
        >
          <ClipboardList size={40} color={palette.white} />
        </View>
        <Text className="text-center text-3xl font-bold tracking-tight text-white">
          HKC Asistencia
        </Text>
        <Text className="mt-1 text-center text-sm" style={{ color: palette.white70 }}>
          Sistema de Control de Asistencia
        </Text>
      </View>

      <View className="w-full max-w-xs">
        <View
          className="h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: palette.white20 }}
        >
          <View className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
        </View>
        <Text className="mt-3 text-center text-xs" style={{ color: palette.white70 }}>
          {step}
        </Text>
      </View>

      <Text className="absolute bottom-8 text-xs" style={{ color: palette.white40 }}>
        v1.0.0 · © 2026 HKC Asistencia
      </Text>
    </View>
  );
}
