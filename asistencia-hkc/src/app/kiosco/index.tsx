import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, User, Wifi } from "lucide-react-native";

import { PulsingOpacity, PulsingRing } from "@/components/attendance/pulse";
import { palette } from "@/constants/palette";
import { useClock } from "@/hooks/use-clock";

const CORNERS = [
  "left-0 top-0 rounded-tl-2xl border-l-2 border-t-2",
  "right-0 top-0 rounded-tr-2xl border-r-2 border-t-2",
  "bottom-0 left-0 rounded-bl-2xl border-b-2 border-l-2",
  "bottom-0 right-0 rounded-br-2xl border-b-2 border-r-2",
];

export default function KioskMainScreen() {
  const now = useClock();
  const [detecting, setDetecting] = useState(false);

  const handleDetect = () => {
    setDetecting(true);
    setTimeout(() => {
      setDetecting(false);
      if (Math.random() > 0.2) {
        router.push("/kiosco/exito");
      } else {
        router.push("/kiosco/error");
      }
    }, 2200);
  };

  return (
    <View className="flex-1 bg-[#0a0f1a]">
      <View className="flex-row items-center justify-between px-4 pb-3 pt-14">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={20} color={palette.white50} />
        </Pressable>
        <View className="items-center">
          <Text className="text-4xl font-bold tracking-tight text-white">
            {now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          </Text>
          <Text className="mt-0.5 text-xs capitalize" style={{ color: palette.white50 }}>
            {now.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>
        <Wifi size={12} color="#4ade80" />
      </View>

      <View className="mx-4 mb-4 mt-3 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[#111827]">
        <View
          className="relative h-64 w-52"
          style={detecting ? { transform: [{ scale: 1.05 }] } : undefined}
        >
          {CORNERS.map((corner, i) => (
            <View
              key={i}
              className={`absolute h-8 w-8 ${corner}`}
              style={{ borderColor: detecting ? "#4ade80" : palette.white60 }}
            />
          ))}

          {detecting ? <PulsingRing color="#4ade80" borderRadius={16} /> : null}

          <View className="absolute inset-0 items-center justify-center">
            <User size={80} color={detecting ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"} />
          </View>

          {detecting ? (
            <PulsingOpacity
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 4,
                borderRadius: 9999,
                backgroundColor: "#4ade80",
              }}
            />
          ) : null}
        </View>

        {detecting ? (
          <View
            className="absolute right-4 top-4 rounded-full px-2 py-1"
            style={{ backgroundColor: palette.green50090 }}
          >
            <Text className="text-xs font-medium text-white">Calidad: Buena</Text>
          </View>
        ) : null}
      </View>

      <View className="gap-3 px-4 pb-8">
        <Text className="text-center text-sm" style={{ color: palette.white70 }}>
          {detecting ? "Procesando reconocimiento…" : "Colócate frente a la cámara"}
        </Text>
        <Pressable
          onPress={handleDetect}
          disabled={detecting}
          className="items-center rounded-2xl py-4"
          style={({ pressed }) => [
            { backgroundColor: detecting ? palette.white10 : palette.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text
            className="text-base font-semibold"
            style={{ color: detecting ? palette.white40 : palette.white }}
          >
            {detecting ? "Reconociendo…" : "Iniciar reconocimiento"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
