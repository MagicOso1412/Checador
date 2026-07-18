import { getDatabase } from "../../database/db";
import { Asistencia } from "../../domain/entities/Asistencia";
import { EstadoSincronizacion } from "../../domain/enums/EstadoSincronizacion";
import { TipoRegistro } from "../../domain/enums/TipoRegistro";
import type { IAsistenciaRepository } from "../../domain/repositories/IAsistenciaRepository";

type AsistenciaRow = {
  id: string;
  trabajador_id: string;
  proyecto_id: string;
  tipo_registro: string;
  fecha_hora: string;
  foto_uri: string;
  latitud: number | null;
  longitud: number | null;
  sincronizado: number;
};

function toEntity(row: AsistenciaRow): Asistencia {
  return new Asistencia(
    row.id,
    row.trabajador_id,
    row.proyecto_id,
    row.tipo_registro as TipoRegistro,
    new Date(row.fecha_hora),
    row.foto_uri,
    row.latitud,
    row.longitud,
    row.sincronizado === EstadoSincronizacion.SINCRONIZADO,
  );
}

const DEFAULT_LIMITE = 100;

export class SQLiteAsistenciaRepository implements IAsistenciaRepository {
  async guardar(asistencia: Asistencia): Promise<void> {
    const db = await getDatabase();

    const sincronizado = asistencia.sincronizado
      ? EstadoSincronizacion.SINCRONIZADO
      : EstadoSincronizacion.PENDIENTE;

    await db.runAsync(
      `
      INSERT INTO asistencias
      (
        id,
        trabajador_id,
        proyecto_id,
        tipo_registro,
        fecha_hora,
        foto_uri,
        latitud,
        longitud,
        sincronizado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        asistencia.id,
        asistencia.trabajadorId,
        asistencia.proyectoId,
        asistencia.tipoRegistro,
        asistencia.fechaHora.toISOString(),
        asistencia.fotoUri,
        asistencia.latitud,
        asistencia.longitud,
        sincronizado,
      ],
    );
  }

  async obtenerPorProyecto(proyectoId?: string, limite: number = DEFAULT_LIMITE): Promise<Asistencia[]> {
    const db = await getDatabase();

    const rows = proyectoId
      ? await db.getAllAsync<AsistenciaRow>(
          `SELECT * FROM asistencias WHERE proyecto_id = ? ORDER BY fecha_hora DESC LIMIT ?`,
          [proyectoId, limite],
        )
      : await db.getAllAsync<AsistenciaRow>(
          `SELECT * FROM asistencias ORDER BY fecha_hora DESC LIMIT ?`,
          [limite],
        );

    return rows.map(toEntity);
  }
}
