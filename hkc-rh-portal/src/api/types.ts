/**
 * Formas de respuesta de `hkc-backend`. Copia manual del contrato del
 * backend (mismo criterio que `AsistenciaSyncPayload` entre cliente y
 * backend) — no hay paquete de tipos compartido entre los tres proyectos
 * todavía.
 */
export interface UsuarioRh {
  id: string;
  email: string;
  nombre: string;
}

export interface LoginResponse {
  token: string;
  usuario: UsuarioRh;
}

/** Tal como la devuelve `GET /api/asistencias` — fila cruda de la tabla del backend, en snake_case. */
export interface AsistenciaRow {
  id: string;
  trabajador_id: string;
  trabajador_nombre: string;
  numero_empleado: string;
  proyecto_id: string;
  proyecto_nombre: string;
  tipo_registro: "ENTRADA" | "SALIDA" | "INICIO_COMIDA" | "FIN_COMIDA";
  fecha_hora: string;
  foto_uri: string;
  latitud: number | null;
  longitud: number | null;
  dispositivo_id: string | null;
  recibido_en: string;
}

export interface AsistenciasResponse {
  total: number;
  registros: AsistenciaRow[];
}

export interface FiltrosAsistencias {
  desde?: string;
  hasta?: string;
  limite?: number;
}
