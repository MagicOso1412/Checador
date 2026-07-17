import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export async function getDatabase() {
    if (!db) {
        db = await SQLite.openDatabaseAsync("asistencia.db");
        // SQLite no aplica llaves foráneas por defecto; hay que activarlo por
        // conexión. Necesario para las FKs de `asistencias` (trabajador_id,
        // proyecto_id) definidas en las migraciones.
        await db.execAsync("PRAGMA foreign_keys = ON;");
    }

    return db;
}