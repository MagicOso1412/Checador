import { getDatabase } from "../../database/db";
import { Proyecto } from "../../domain/entities/Proyecto";
import type { IProyectoRepository } from "../../domain/repositories/IProyectoRepository";

type ProyectoRow = {
  id: string;
  nombre: string;
  activo: number;
};

function toEntity(row: ProyectoRow): Proyecto {
  return new Proyecto(row.id, row.nombre, row.activo === 1);
}

export class SQLiteProyectoRepository implements IProyectoRepository {
  async obtenerTodos(): Promise<Proyecto[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<ProyectoRow>(
      "SELECT id, nombre, activo FROM proyectos ORDER BY nombre ASC",
    );

    return rows.map(toEntity);
  }

  async obtenerActivos(): Promise<Proyecto[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<ProyectoRow>(
      "SELECT id, nombre, activo FROM proyectos WHERE activo = 1 ORDER BY nombre ASC",
    );

    return rows.map(toEntity);
  }
}
