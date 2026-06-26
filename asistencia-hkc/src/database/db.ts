import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export async function getDatabase() {
    if (!db) {
        db = await SQLite.openDatabaseAsync("asistencia.db");
    }

    return db;
}