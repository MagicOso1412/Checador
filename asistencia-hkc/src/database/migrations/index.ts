import { migration001CreateTrabajadores } from "./001_create_trabajadores";
import { migration002CreateProyectos } from "./002_create_proyectos";
import { migration003CreateAsistencias } from "./003_create_asistencias";
import type { Migration } from "./types";

/**
 * Lista de todas las migraciones, en orden de versión.
 * Para agregar una nueva: crea `00N_descripcion.ts` exportando un `Migration`
 * con `version: N` (siguiente número consecutivo) y agrégala aquí al final.
 * Nunca modifiques una migración ya publicada; agrega una nueva en su lugar.
 */
export const migrations: Migration[] = [
  migration001CreateTrabajadores,
  migration002CreateProyectos,
  migration003CreateAsistencias,
];

export type { Migration } from "./types";
