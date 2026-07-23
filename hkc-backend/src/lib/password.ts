import bcrypt from "bcryptjs";

/**
 * Hash/verificación de contraseñas para `usuarios_rh`. Se usa `bcryptjs`
 * (implementación pura en JavaScript) en vez de `bcrypt` (que requiere
 * compilar un módulo nativo, igual que `better-sqlite3`) — para el volumen
 * de logins de un puñado de personas de RH, la diferencia de performance es
 * irrelevante, y evita depender de que cada máquina donde se instale tenga
 * un toolchain de compilación funcionando.
 */
const SALT_ROUNDS = 10;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
