import * as Crypto from "expo-crypto";

/**
 * Genera un UUID v4. Usa `expo-crypto` (implementación nativa) en vez del
 * paquete `uuid` de npm: `uuid` v9+ depende del `crypto.getRandomValues`
 * global del navegador, que no existe en el motor Hermes de React Native sin
 * un polyfill adicional (`react-native-get-random-values`) importado antes
 * que cualquier otra cosa en el entry point — un requisito frágil y fácil de
 * romper. `expo-crypto` resuelve esto de forma nativa y sin polyfills.
 */
export function generateId(): string {
  return Crypto.randomUUID();
}
