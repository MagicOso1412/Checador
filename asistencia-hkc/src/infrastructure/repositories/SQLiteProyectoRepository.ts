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

  async buscarPorId(id: string): Promise<Proyecto | null> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<ProyectoRow>(
      "SELECT id, nombre, activo FROM proyectos WHERE id = ? LIMIT 1",
      [id],
    );

    return row ? toEntity(row) : null;
  }

  async buscarPorNombre(nombre: string): Promise<Proyecto | null> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<ProyectoRow>(
      "SELECT id, nombre, activo FROM proyectos WHERE nombre = ? LIMIT 1",
      [nombre],
    );

    return row ? toEntity(row) : null;
  }

  async crear(proyecto: Proyecto): Promise<void> {
    const db = await getDatabase();

    await db.runAsync("INSERT INTO proyectos (id, nombre, activo) VALUES (?, ?, ?)", [
      proyecto.id,
      proyecto.nombre,
      proyecto.activo ? 1 : 0,
    ]);
  }

  async actualizar(proyecto: Proyecto): Promise<void> {
    const db = await getDatabase();

    await db.runAsync("UPDATE proyectos SET nombre = ?, activo = ? WHERE id = ?", [
      proyecto.nombre,
      proyecto.activo ? 1 : 0,
      proyecto.id,
    ]);
  }

  async eliminar(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE proyectos SET activo = 0 WHERE id = ?", [id]);
  }
}
