import { randomBytes, randomUUID } from "node:crypto";
import { getDatabase } from "../db/db";
import { runMigrations } from "../db/migrationRunner";

/**
 * Script de línea de comandos para dar de alta un dispositivo autorizado a
 * sincronizar. No hay autoregistro a propósito (ver BACKEND_ARCHITECTURE.md,
 * "Autenticación") — un admin lo corre a mano en el Mac mini al entregar un
 * teléfono nuevo, y copia la API key impresa a la configuración del
 * dispositivo del lado del cliente.
 *
 * Uso: npx tsx src/scripts/crearDispositivo.ts "Kiosco Obra Norte"
 */
function main(): void {
  const nombre = process.argv[2];
  if (!nombre) {
    console.error('Uso: npx tsx src/scripts/crearDispositivo.ts "Nombre del dispositivo"');
    process.exit(1);
  }

  runMigrations();

  const db = getDatabase();
  const id = randomUUID();
  const apiKey = randomBytes(24).toString("hex");

  db.prepare("INSERT INTO dispositivos (id, nombre, api_key, activo, creado_en) VALUES (?, ?, ?, 1, ?)").run(
    id,
    nombre,
    apiKey,
    new Date().toISOString(),
  );

  console.log(`Dispositivo creado: ${nombre}`);
  console.log(`  id:      ${id}`);
  console.log(`  api_key: ${apiKey}`);
  console.log("\nGuarda esta API key ahora — no se vuelve a mostrar.");
}

main();
