import { getDatabase } from "./db";

export async function runMigrations() {

    const db = await getDatabase();

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS trabajadores (
            id TEXT PRIMARY KEY,
            numero_empleado TEXT,
            nombre TEXT,
            apellido_paterno TEXT,
            apellido_materno TEXT,
            activo INTEGER DEFAULT 1
        );
    `);

    console.log("Migraciones ejecutadas");
}