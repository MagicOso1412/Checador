import { randomUUID } from "node:crypto";
import { getDatabase } from "../db/db";
import { runMigrations } from "../db/migrationRunner";
import { hashPassword } from "../lib/password";

/**
 * Script de línea de comandos para dar de alta un usuario de RH. Sin
 * autoregistro a propósito (ver BACKEND_ARCHITECTURE.md) — un admin lo
 * corre a mano en el Mac mini.
 *
 * Uso: npx tsx src/scripts/crearUsuarioRh.ts "ana@empresa.com" "Ana Pérez" "unaContraseñaSegura"
 */
function main(): void {
  const [email, nombre, password] = process.argv.slice(2);
  if (!email || !nombre || !password) {
    console.error('Uso: npx tsx src/scripts/crearUsuarioRh.ts "email" "Nombre" "password"');
    process.exit(1);
  }

  runMigrations();

  const db = getDatabase();
  const id = randomUUID();

  db.prepare(
    "INSERT INTO usuarios_rh (id, email, nombre, password_hash, activo, creado_en) VALUES (?, ?, ?, ?, 1, ?)",
  ).run(id, email, nombre, hashPassword(password), new Date().toISOString());

  console.log(`Usuario de RH creado: ${nombre} <${email}>`);
}

main();
