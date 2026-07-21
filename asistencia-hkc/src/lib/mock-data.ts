/**
 * Quedan aquí solo los valores que todavía no tienen una fuente real: los
 * tipos/estilos de estado usados en el historial y las etiquetas de tipo de
 * movimiento (dominio real es `TipoRegistro`, ver `utils/tipoRegistro.ts`
 * para el mapeo). Los datos de ejemplo de proyectos/trabajadores/historial
 * ya se reemplazaron por SQLite real y se retiraron de este archivo.
 */

export type HistoryStatus = "synced" | "pending" | "error";

export const STATUS_STYLES: Record<HistoryStatus, { bg: string; text: string }> = {
  synced: { bg: "bg-green-100", text: "text-green-700" },
  pending: { bg: "bg-amber-100", text: "text-amber-700" },
  error: { bg: "bg-red-100", text: "text-red-700" },
};

export const STATUS_LABELS: Record<HistoryStatus, string> = {
  synced: "Sincronizado",
  pending: "Pendiente",
  error: "Error",
};

export const MOVEMENT_TYPES = ["Entrada", "Salida", "Comida Inicio", "Comida Fin"] as const;
