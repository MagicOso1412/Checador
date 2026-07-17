import type { ViewStyle } from "react-native";

/**
 * Estilos de sombra equivalentes a las utilidades `shadow-sm` / `shadow-md` / `shadow-lg`
 * de Tailwind, aplicados como `style` en vez de `className`.
 *
 * Nota: usar las clases `shadow-*` de NativeWind junto con Expo Router puede disparar un
 * error intermitente "Couldn't find a navigation context" (bug conocido de la capa de
 * CSS-interop de NativeWind: https://github.com/nativewind/nativewind/issues/1536). Por eso
 * en esta app las sombras se aplican siempre vía `style`, nunca vía className.
 */
export const shadowSm: ViewStyle = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 2,
  elevation: 2,
};

export const shadowMd: ViewStyle = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};

export const shadowLg: ViewStyle = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 6,
};

/** Feedback visual para Pressable al presionar, sin usar `active:` de NativeWind. */
export const pressedStyle: ViewStyle = { opacity: 0.9 };
