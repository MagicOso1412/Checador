import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";

import { palette } from "@/constants/palette";

/**
 * Encabezado azul reutilizado en la mayoría de las pantallas del flujo:
 * botón de regreso, título y subtítulo opcional.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Atrás",
  className = "bg-primary",
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <View className={`px-4 pb-5 pt-14 ${className}`}>
      {onBack ? (
        <Pressable onPress={onBack} className="mb-3 flex-row items-center gap-1">
          <ArrowLeft size={16} color={palette.white70} />
          <Text className="text-sm" style={{ color: palette.white70 }}>
            {backLabel}
          </Text>
        </Pressable>
      ) : null}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">{title}</Text>
          {subtitle ? (
            <Text className="mt-0.5 text-sm" style={{ color: palette.white70 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}
