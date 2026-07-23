import { migration001CreateAsistencias } from "./001_create_asistencias";
import { migration002CreateDispositivos } from "./002_create_dispositivos";
import { migration003CreateUsuariosRh } from "./003_create_usuarios_rh";
import type { Migration } from "./types";

/**
 * Lista de todas las migraciones, en orden de versión. Mismo patrón y misma
 * regla que en el cliente: nunca modificar una migración ya publicada,
 * siempre agregar una nueva con el siguiente número de versión.
 */
export const migrations: Migration[] = [
  migration001CreateAsistencias,
  migration002CreateDispositivos,
  migration003CreateUsuariosRh,
];

export type { Migration } from "./types";
