/**
 * Paleta de color de la app, tomada del diseño en
 * "interfaz aplicación de asistencia" (src/styles/theme.css).
 * Se mantiene sincronizada a mano con tailwind.config.js.
 */
export const palette = {
  background: "#f4f6fa",
  foreground: "#0d1b3e",
  card: "#ffffff",
  primary: "#1565c0",
  primaryForeground: "#ffffff",
  secondary: "#e3eaf6",
  secondaryForeground: "#1565c0",
  muted: "#eef2f9",
  mutedForeground: "#637290",
  accent: "#1976d2",
  destructive: "#d32f2f",
  border: "rgba(21, 101, 192, 0.12)",
  inputBackground: "#eef2f9",
  success: "#2e7d32",
  white: "#ffffff",
  white80: "rgba(255,255,255,0.8)",
  white70: "rgba(255,255,255,0.7)",
  white60: "rgba(255,255,255,0.6)",
  white50: "rgba(255,255,255,0.5)",
  white40: "rgba(255,255,255,0.4)",
  white30: "rgba(255,255,255,0.3)",
  white20: "rgba(255,255,255,0.2)",
  white10: "rgba(255,255,255,0.1)",
  primary10: "rgba(21,101,192,0.1)",
  green30070: "rgba(134,239,172,0.7)",
  green40030: "rgba(74,222,128,0.3)",
  green40040: "rgba(74,222,128,0.4)",
  green40060: "rgba(74,222,128,0.6)",
  green50090: "rgba(34,197,94,0.9)",
  green90030: "rgba(20,83,45,0.3)",
  destructive40: "rgba(211,47,47,0.4)",
} as const;

/**
 * Nota importante: en esta app NUNCA se usan las clases `shadow-*`, `opacity-*` /
 * `active:opacity-*`, `animate-*` ni el atajo de opacidad `color/NN` (p. ej. `bg-white/20`)
 * de NativeWind como className. Ese patrón dispara intermitentemente el error
 * "Couldn't find a navigation context" al navegar con Expo Router — es un bug conocido de
 * la capa de CSS-interop de NativeWind (https://github.com/nativewind/nativewind/issues/1536,
 * https://github.com/expo/expo/issues/38191). En su lugar, esos valores se aplican siempre
 * vía `style` usando los colores de esta paleta y los helpers de `shadows.ts`.
 */
