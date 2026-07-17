import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Bell, Globe, Image as ImageIcon, Moon, RefreshCw, Server } from "lucide-react-native";

import { ScreenHeader } from "@/components/attendance/screen-header";
import { palette } from "@/constants/palette";
import { shadowSm } from "@/constants/shadows";

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [syncAlerts, setSyncAlerts] = useState(true);
  const [language, setLanguage] = useState("Español");
  const [server, setServer] = useState("Producción");
  const [syncFreq, setSyncFreq] = useState("15min");
  const [imgQuality, setImgQuality] = useState("Alta");

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Configuración" onBack={() => router.back()} className="bg-primary pb-4" />

      <View className="flex-1 gap-4 p-4">
        <SettingsGroup title="Aplicación">
          <SettingsToggle
            icon={<Moon size={16} color={palette.mutedForeground} />}
            label="Modo oscuro"
            value={darkMode}
            onChange={setDarkMode}
          />
          <SettingsSelect
            icon={<Globe size={16} color={palette.mutedForeground} />}
            label="Idioma"
            value={language}
            options={["Español", "English"]}
            onChange={setLanguage}
          />
        </SettingsGroup>

        <SettingsGroup title="Conexión">
          <SettingsSelect
            icon={<Server size={16} color={palette.mutedForeground} />}
            label="Servidor"
            value={server}
            options={["Producción", "Staging", "Personalizado"]}
            onChange={setServer}
          />
          <SettingsSelect
            icon={<RefreshCw size={16} color={palette.mutedForeground} />}
            label="Frecuencia de sync"
            value={syncFreq}
            options={["5min", "15min", "30min", "Manual"]}
            onChange={setSyncFreq}
          />
        </SettingsGroup>

        <SettingsGroup title="Captura">
          <SettingsSelect
            icon={<ImageIcon size={16} color={palette.mutedForeground} />}
            label="Calidad de imágenes"
            value={imgQuality}
            options={["Baja", "Media", "Alta"]}
            onChange={setImgQuality}
          />
        </SettingsGroup>

        <SettingsGroup title="Notificaciones">
          <SettingsToggle
            icon={<Bell size={16} color={palette.mutedForeground} />}
            label="Alertas de sincronización"
            value={syncAlerts}
            onChange={setSyncAlerts}
          />
        </SettingsGroup>

        <View className="items-center rounded-2xl border border-border bg-card p-4">
          <Text className="text-xs text-muted-foreground">HKC Asistencia v1.0.0</Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            © 2026 HKC Asistencia · Todos los derechos reservados
          </Text>
        </View>
      </View>
    </View>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </Text>
      <View
        className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card"
        style={shadowSm}
      >
        {children}
      </View>
    </View>
  );
}

function SettingsToggle({
  icon,
  label,
  value,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3.5">
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-sm text-foreground">{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#cbd5e1", true: palette.primary }}
        thumbColor={palette.white}
      />
    </View>
  );
}

function SettingsSelect({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const handlePress = () => {
    const next = options[(options.indexOf(value) + 1) % options.length];
    onChange(next);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center justify-between px-4 py-3.5"
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-sm text-foreground">{label}</Text>
      </View>
      <Text className="text-sm font-medium text-primary">{value}</Text>
    </Pressable>
  );
}
