import type { ReactNode } from "react";
import { Text, View, type StyleProp, type TextStyle } from "react-native";

/**
 * Fila "etiqueta — valor" usada en pantallas de confirmación/admin/sync.
 *
 * `labelStyle`/`valueStyle` existen para los casos donde el color necesita opacidad (p. ej.
 * texto blanco semitransparente sobre fondos oscuros): NO se debe usar el atajo `color/NN`
 * de NativeWind (como `text-white/50`) vía className, porque puede disparar el bug de
 * "Couldn't find a navigation context" con Expo Router. Ver src/constants/palette.ts.
 */
export function DetailRow({
  icon,
  label,
  value,
  valueClassName,
  labelClassName,
  valueStyle,
  labelStyle,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
  valueStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className={labelClassName ?? "text-sm text-muted-foreground"} style={labelStyle}>
          {label}
        </Text>
      </View>
      <Text
        className={valueClassName ?? "max-w-[55%] text-right text-sm font-medium text-foreground"}
        style={valueStyle}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

/** Bloque numérico grande (usado en la barra de estadísticas de Modo Campo). */
export function StatBlock({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <View>
      <Text
        className={`text-center font-bold ${small ? "text-base" : "text-2xl"} ${
          accent ? "text-amber-500" : "text-primary"
        }`}
      >
        {value}
      </Text>
      <Text className="mt-0.5 text-center text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}

/** Chip de estado (Sincronizado / Pendiente / Error, etc.). */
export function StatusPill({
  label,
  bgClassName,
  textClassName,
}: {
  label: string;
  bgClassName: string;
  textClassName: string;
}) {
  return (
    <View className={`rounded-full px-2.5 py-1 ${bgClassName}`}>
      <Text className={`text-xs font-medium ${textClassName}`}>{label}</Text>
    </View>
  );
}
