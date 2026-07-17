/**
 * @deprecated Este archivo (seeds.ts) se reemplazó por `src/database/seeds/`
 * (carpeta), que además de trabajadores ahora también siembra proyectos. Se
 * conserva por compatibilidad; usa `runSeeds` de `./seeds/index` en código nuevo.
 *
 * Ver la nota equivalente en `migrations.ts`: por la colisión de nombre entre
 * este archivo y la carpeta `seeds/`, cualquier import con el specifier corto
 * "./seeds" resuelve a ESTE archivo. Por eso el código nuevo importa
 * explícitamente desde "./seeds/index".
 */
export { seedTrabajadores } from "./seeds/seedTrabajadores";
