import { TipoRegistro } from "@/domain/enums/TipoRegistro";
import { MOVEMENT_TYPES } from "@/lib/mock-data";

/**
 * Traduce la etiqueta de movimiento que usa la UI (`MOVEMENT_TYPES`, en
 * español y pensada para mostrarse) al enum de dominio `TipoRegistro` que se
 * guarda en SQLite. Vive aquí (no en `mock-data.ts`) porque `TipoRegistro` es
 * dominio real, no un dato de ejemplo.
 */
const LABEL_TO_TIPO_REGISTRO: Record<(typeof MOVEMENT_TYPES)[number], TipoRegistro> = {
  Entrada: TipoRegistro.ENTRADA,
  Salida: TipoRegistro.SALIDA,
  "Comida Inicio": TipoRegistro.INICIO_COMIDA,
  "Comida Fin": TipoRegistro.FIN_COMIDA,
};

export function mapMovementLabelToTipoRegistro(
  label: (typeof MOVEMENT_TYPES)[number],
): TipoRegistro {
  return LABEL_TO_TIPO_REGISTRO[label];
}

const TIPO_REGISTRO_TO_LABEL: Record<TipoRegistro, (typeof MOVEMENT_TYPES)[number]> = {
  [TipoRegistro.ENTRADA]: "Entrada",
  [TipoRegistro.SALIDA]: "Salida",
  [TipoRegistro.INICIO_COMIDA]: "Comida Inicio",
  [TipoRegistro.FIN_COMIDA]: "Comida Fin",
};

/** Inverso de `mapMovementLabelToTipoRegistro`, para mostrar un `TipoRegistro` guardado en SQLite en la UI. */
export function mapTipoRegistroToLabel(tipo: TipoRegistro): (typeof MOVEMENT_TYPES)[number] {
  return TIPO_REGISTRO_TO_LABEL[tipo];
}
