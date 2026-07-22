import { migration001CreateTrabajadores } from "./001_create_trabajadores";
import { migration002CreateProyectos } from "./002_create_proyectos";
import { migration003CreateAsistencias } from "./003_create_asistencias";
import { migration004CreateConfiguracionDispositivo } from "./004_create_configuracion_dispositivo";
import { migration005AddUniqueNumeroEmpleado } from "./005_add_unique_numero_empleado";
import { migration006AddUniqueProyectoNombre } from "./006_add_unique_proyecto_nombre";
import { migration007AddSyncTrackingAsistencias } from "./007_add_sync_tracking_asistencias";
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
  migration004CreateConfiguracionDispositivo,
  migration005AddUniqueNumeroEmpleado,
  migration006AddUniqueProyectoNombre,
  migration007AddSyncTrackingAsistencias,
];

export type { Migration } from "./types";
