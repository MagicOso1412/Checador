/**
 * @deprecated Este archivo (migrations.ts) se reemplazó por el sistema de
 * migraciones versionadas en `src/database/migrations/` (carpeta) +
 * `src/database/migrationRunner.ts`. Se conserva este archivo únicamente por
 * compatibilidad; usa `runMigrations` de `./migrationRunner` en código nuevo.
 *
 * IMPORTANTE: no se pudo eliminar este archivo por una restricción del entorno
 * donde se escribió (no permite borrar archivos). Como este archivo y la carpeta
 * `migrations/` comparten nombre, cualquier `import ... from "./migrations"`
 * (specifier corto, sin "/index") resuelve a ESTE archivo y no a la carpeta.
 * Por eso `migrationRunner.ts` importa explícitamente desde "./migrations/index".
 * Si en algún momento puedes borrar archivos localmente, borra este archivo y
 * usa el specifier corto "./migrations" con normalidad.
 */
export { runMigrations } from "./migrationRunner";
