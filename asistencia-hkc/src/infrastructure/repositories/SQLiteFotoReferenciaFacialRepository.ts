import { getDatabase } from "../../database/db";
import { FotoReferenciaFacial } from "../../domain/entities/FotoReferenciaFacial";
import type { IFotoReferenciaFacialRepository } from "../../domain/repositories/IFotoReferenciaFacialRepository";

type FotoRow = {
  id: string;
  trabajador_id: string;
  foto_uri: string;
  creado_en: string;
};

function toEntity(row: FotoRow): FotoReferenciaFacial {
  return new FotoReferenciaFacial(row.id, row.trabajador_id, row.foto_uri, new Date(row.creado_en));
}

export class SQLiteFotoReferenciaFacialRepository implements IFotoReferenciaFacialRepository {
  async obtenerPorTrabajador(trabajadorId: string): Promise<FotoReferenciaFacial[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<FotoRow>(
      `SELECT id, trabajador_id, foto_uri, creado_en FROM fotos_referencia_facial
       WHERE trabajador_id = ? ORDER BY creado_en ASC`,
      [trabajadorId],
    );

    return rows.map(toEntity);
  }

  async contarPorTrabajador(trabajadorId: string): Promise<number> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM fotos_referencia_facial WHERE trabajador_id = ?`,
      [trabajadorId],
    );

    return row?.total ?? 0;
  }

  async agregar(foto: FotoReferenciaFacial): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      `INSERT INTO fotos_referencia_facial (id, trabajador_id, foto_uri, creado_en) VALUES (?, ?, ?, ?)`,
      [foto.id, foto.trabajadorId, foto.fotoUri, foto.creadoEn.toISOString()],
    );
  }

  async eliminar(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM fotos_referencia_facial WHERE id = ?", [id]);
  }
}
