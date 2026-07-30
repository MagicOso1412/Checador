import * as Crypto from "expo-crypto";
import { guardarConfigDispositivo, obtenerConfigDispositivo } from "../storage/deviceConfigStorage";

const CLAVE_PIN_HASH = "admin_pin_hash";

/**
 * PIN de dispositivo para entrar a `/admin` en la app móvil. Protege la
 * configuración de ESE dispositivo (cambiar proyecto, editar
 * trabajadores/proyectos, ajustes) de que cualquiera que tome la tablet la
 * toque — es un candado físico de operador, no un sistema de identidad de
 * personas. Por eso es deliberadamente distinto del login de RH
 * (`hkc-rh-portal`, usuario/contraseña + JWT): ese protege datos de la
 * empresa completa accedidos remotamente; este protege un aparato.
 *
 * **Nota de seguridad honesta:** el PIN se guarda como un hash SHA-256 (con
 * un salt fijo de la app, vía `expo-crypto`, ya dependencia del proyecto —
 * no se agregó nada nuevo) en `configuracion_dispositivo` (SQLite local).
 * Esto evita guardar el PIN en texto plano, pero SHA-256 sin salt por
 * dispositivo ni costo computacional (a diferencia de bcrypt en el backend)
 * no es criptografía de grado alto — es proporcional a la amenaza real
 * (alguien que agarra la tablet), no a un atacante con acceso al archivo
 * SQLite del dispositivo. No reutilizar este mecanismo para nada que
 * proteja datos sensibles de verdad (eso ya vive en el backend, con bcrypt).
 */
const SALT_APP = "hkc-attendance-admin-pin";

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${SALT_APP}:${pin}`);
}

export async function tienePinConfigurado(): Promise<boolean> {
  const hash = await obtenerConfigDispositivo(CLAVE_PIN_HASH);
  return hash !== null;
}

export async function configurarPin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await guardarConfigDispositivo(CLAVE_PIN_HASH, hash);
}

export async function verificarPin(pin: string): Promise<boolean> {
  const hashGuardado = await obtenerConfigDispositivo(CLAVE_PIN_HASH);
  if (!hashGuardado) return false;
  const hashIngresado = await hashPin(pin);
  return hashIngresado === hashGuardado;
}
