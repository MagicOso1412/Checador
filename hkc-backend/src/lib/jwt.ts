import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";

/**
 * Firma/verificación de tokens de sesión del portal RH.
 *
 * **Importante para producción (Mac mini):** si no defines `JWT_SECRET` como
 * variable de entorno persistente, se genera uno aleatorio en cada arranque
 * del proceso — funciona para desarrollo, pero invalida todas las sesiones
 * activas cada vez que el servidor se reinicia (deploy, crash, reboot). En
 * producción, define `JWT_SECRET` en el entorno del Mac mini (un valor largo
 * y aleatorio, generado una sola vez) para que las sesiones sobrevivan
 * reinicios del proceso.
 */
const JWT_SECRET = process.env.JWT_SECRET ?? randomBytes(32).toString("hex");

if (!process.env.JWT_SECRET) {
  console.warn(
    "[jwt] JWT_SECRET no está definido — usando uno generado al vuelo. " +
      "Las sesiones de RH se invalidarán en el próximo reinicio. Define JWT_SECRET en producción.",
  );
}

const EXPIRES_IN = "8h";

export interface SesionRhPayload {
  usuarioId: string;
  email: string;
}

export function firmarSesionRh(payload: SesionRhPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verificarSesionRh(token: string): SesionRhPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SesionRhPayload;
  } catch {
    return null;
  }
}
