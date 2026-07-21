import { getDatabase } from "../../database/db";

/**
 * Configuración clave/valor persistida en SQLite (tabla
 * `configuracion_dispositivo`, migración 004). Se usa para datos del
 * dispositivo que deben sobrevivir reinicios de la app pero que no son parte
 * del dominio de negocio (por ejemplo, qué proyecto tiene asignado un
 * dispositivo en Modo Kiosco).
 *
 * Deliberadamente NO usa AsyncStorage ni ningún otro módulo nativo aparte:
 * SQLite ya es una dependencia nativa que funciona en esta app, así que
 * reutilizarla evita agregar otra vía de almacenamiento (y el riesgo de que
 * un módulo nuevo no esté linkeado en el build nativo del dispositivo).
 */
export async function obtenerConfigDispositivo(clave: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ valor: string }>(
    "SELECT valor FROM configuracion_dispositivo WHERE clave = ?",
    [clave],
  );
  return row?.valor ?? null;
}

export async function guardarConfigDispositivo(clave: string, valor: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
    INSERT INTO configuracion_dispositivo (clave, valor)
    VALUES (?, ?)
    ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor
    `,
    [clave, valor],
  );
}
