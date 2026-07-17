import { seedProyectos } from "./seedProyectos";
import { seedTrabajadores } from "./seedTrabajadores";

/**
 * Corre todos los seeds de desarrollo. Cada seed es idempotente (revisa si ya
 * hay datos antes de insertar), así que es seguro llamar esto en cada arranque.
 * Cuando existan pantallas de administración reales (Sprint 3), esto debería
 * dejar de ejecutarse en builds de producción.
 */
export async function runSeeds(): Promise<void> {
  await seedTrabajadores();
  await seedProyectos();
}
