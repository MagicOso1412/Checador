/**
 * Copia manual del contrato definido en
 * `asistencia-hkc/src/application/dto/AsistenciaSyncPayload.ts`. Los dos
 * proyectos son paquetes npm independientes sin un paquete de tipos
 * compartido todavía (ver BACKEND_ARCHITECTURE.md, "Nota sobre tipos
 * compartidos") — si cambias uno, cambia el otro.
 */
export interface AsistenciaSyncPayload {
  id: string;
  trabajadorId: string;
  trabajadorNombre: string;
  numeroEmpleado: string;
  proyectoId: string;
  proyectoNombre: string;
  tipoRegistro: "ENTRADA" | "SALIDA" | "INICIO_COMIDA" | "FIN_COMIDA";
  fechaHora: string;
  fotoUri: string;
  latitud: number | null;
  longitud: number | null;
}

const TIPOS_VALIDOS = new Set(["ENTRADA", "SALIDA", "INICIO_COMIDA", "FIN_COMIDA"]);

/**
 * Valida el body recibido en `POST /api/asistencias` sin depender de una
 * librería de validación externa (zod, etc.) — el contrato es pequeño y fijo
 * por ahora; si crece, ese es el momento de introducir una.
 */
export function esAsistenciaSyncPayloadValido(body: unknown): body is AsistenciaSyncPayload {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;

  return (
    typeof b.id === "string" &&
    b.id.length > 0 &&
    typeof b.trabajadorId === "string" &&
    typeof b.trabajadorNombre === "string" &&
    typeof b.numeroEmpleado === "string" &&
    typeof b.proyectoId === "string" &&
    typeof b.proyectoNombre === "string" &&
    typeof b.tipoRegistro === "string" &&
    TIPOS_VALIDOS.has(b.tipoRegistro) &&
    typeof b.fechaHora === "string" &&
    !Number.isNaN(Date.parse(b.fechaHora)) &&
    typeof b.fotoUri === "string" &&
    (b.latitud === null || typeof b.latitud === "number") &&
    (b.longitud === null || typeof b.longitud === "number")
  );
}
