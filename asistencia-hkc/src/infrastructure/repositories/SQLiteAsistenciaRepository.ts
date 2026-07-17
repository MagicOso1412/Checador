import { getDatabase } from "../../database/db";
import { Asistencia } from "../../domain/entities/Asistencia";
import { EstadoSincronizacion } from "../../domain/enums/EstadoSincronizacion";
import type { IAsistenciaRepository } from "../../domain/repositories/IAsistenciaRepository";

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
}
