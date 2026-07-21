import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Camera,
  ChevronRight,
  History,
  Layers,
  Settings,
  Shield,
  UploadCloud,
  Wifi,
} from "lucide-react-native";

import { palette } from "@/constants/palette";
import { shadowSm } from "@/constants/shadows";
import { useAttendance } from "@/context/attendance-context";
import { useClock } from "@/hooks/use-clock";

export default function ModeSelectScreen() {
  const now = useClock();
  const { setOperationMode } = useAttendance();

  const handleKiosco = () => {
    setOperationMode("kiosco");
    router.push("/kiosco");
  };

  const handleCampo = () => {
    setOperationMode("campo");
    router.push("/proyecto/seleccionar");
  };
  const time = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <View className="flex-1 bg-background">
      <View className="bg-primary px-5 pb-8 pt-14">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-sm capitalize" style={{ color: palette.white70 }}>
            {date}
          </Text>
          <View className="flex-row items-center gap-1">
            <Wifi size={12} color={palette.white70} />
            <Text className="text-xs" style={{ color: palette.white70 }}>
              En línea
            </Text>
          </View>
        </View>
        <Text className="text-5xl font-bold tracking-tight text-white">{time}</Text>
        <Text className="mt-2 text-sm" style={{ color: palette.white80 }}>
          Constructora Ávila S.A. de C.V.
        </Text>
      </View>

      <View className="flex-1 gap-4 p-5">
        <Text className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Selecciona modo
        </Text>

        <Pressable
          onPress={handleKiosco}
          className="flex-row items-center gap-4 rounded-2xl border border-border bg-card p-5"
          style={({ pressed }) => [shadowSm, pressed && { opacity: 0.9 }]}
        >
          <View className="h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: palette.primary10 }}>
            <Camera size={28} color={palette.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-foreground">Modo Kiosco</Text>
            <Text className="mt-0.5 text-sm text-muted-foreground">
              Reconocimiento facial automático en punto fijo
            </Text>
          </View>
          <ChevronRight size={20} color={palette.mutedForeground} />
        </Pressable>

        <Pressable
          onPress={handleCampo}
          className="flex-row items-center gap-4 rounded-2xl border border-border bg-card p-5"
          style={({ pressed }) => [shadowSm, pressed && { opacity: 0.9 }]}
        >
          <View className="h-14 w-14 items-center justify-center rounded-xl bg-amber-100">
            <Layers size={28} color="#d97706" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-foreground">Modo Campo</Text>
            <Text className="mt-0.5 text-sm text-muted-foreground">
              Registro por proyecto en ubicaciones exteriores
            </Text>
          </View>
          <ChevronRight size={20} color={palette.mutedForeground} />
        </Pressable>

        <View className="mt-auto flex-row flex-wrap gap-3">
          <NavTile
            icon={<History size={20} color="#4f46e5" />}
            label="Historial"
            colorClassName="bg-indigo-100"
            onPress={() => router.push("/historial")}
          />
          <NavTile
            icon={<Settings size={20} color="#475569" />}
            label="Configuración"
            colorClassName="bg-slate-100"
            onPress={() => router.push("/configuracion")}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-around border-t border-border bg-card px-6 py-2">
        <FooterTab
          icon={<History size={20} color={palette.mutedForeground} />}
          label="Historial"
          onPress={() => router.push("/historial")}
        />
        <FooterTab
          icon={<UploadCloud size={20} color={palette.mutedForeground} />}
          label="Sync"
          onPress={() => router.push("/sync")}
        />
        <FooterTab
          icon={<Shield size={20} color={palette.mutedForeground} />}
          label="Admin"
          onPress={() => router.push("/admin")}
        />
        <FooterTab
          icon={<Settings size={20} color={palette.mutedForeground} />}
          label="Config"
          onPress={() => router.push("/configuracion")}
        />
      </View>

      <Pressable onPress={() => router.push("/device-setup")} className="pb-3">
        <Text className="text-center text-xs text-muted-foreground">
          Configuración inicial del dispositivo
        </Text>
      </Pressable>
    </View>
  );
}

function NavTile({
  icon,
  label,
  colorClassName,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  colorClassName: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="min-w-[47%] flex-1 flex-row items-center gap-2 rounded-xl border border-border bg-card p-3"
      style={({ pressed }) => pressed && { opacity: 0.9 }}
    >
      <View className={`h-8 w-8 items-center justify-center rounded-lg ${colorClassName}`}>
        {icon}
      </View>
      <Text className="text-sm font-medium text-foreground">{label}</Text>
    </Pressable>
  );
}

function FooterTab({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="items-center gap-0.5 py-1">
      {icon}
      <Text className="text-[10px] text-muted-foreground">{label}</Text>
    </Pressable>
  );
}
