import { useEffect, useState } from "react";

import { runMigrations } from "@/database/migrationRunner";
import { runSeeds } from "@/database/seeds/index";

/**
 * Corre las migraciones versionadas y los seeds de desarrollo una vez, al
 * arrancar la app, antes de que cualquier pantalla intente leer de SQLite.
 * Las pantallas nunca deben llamar `runMigrations`/`runSeeds` directamente.
 */
export function useDatabaseReady() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await runMigrations();
        await runSeeds();
        if (!cancelled) setReady(true);
      } catch (err) {
        console.error("[db] error al preparar la base de datos", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al preparar la base de datos");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}
