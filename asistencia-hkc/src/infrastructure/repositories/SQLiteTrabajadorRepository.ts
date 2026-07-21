import { getDatabase } from "../../database/db";
import { Trabajador } from "../../domain/entities/Trabajador";
import type { ITrabajadorRepository } from "../../domain/repositories/ITrabajadorRepository";

type TrabajadorRow = {
  id: string;
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  activo: number;
};

const SELECT_COLUMNS = `
  id,
  numero_empleado as numeroEmpleado,
  nombre,
  apellido_paterno as apellidoPaterno,
  apellido_materno as apellidoMaterno,
  activo
`;

function toEntity(row: TrabajadorRow): Trabajador {
  return new Trabajador(
    row.id,
    row.numeroEmpleado,
    row.nombre,
    row.apellidoPaterno,
    row.apellidoMaterno,
    row.activo === 1,
  );
}

export class SQLiteTrabajadorRepository implements ITrabajadorRepository {
  async obtenerTodos(): Promise<Trabajador[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<TrabajadorRow>(
      `SELECT ${SELECT_COLUMNS} FROM trabajadores ORDER BY nombre ASC`,
    );

    return rows.map(toEntity);
  }

  async obtenerActivos(): Promise<Trabajador[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<TrabajadorRow>(
      `SELECT ${SELECT_COLUMNS} FROM trabajadores WHERE activo = 1 ORDER BY nombre ASC`,
    );

    return rows.map(toEntity);
  }

  async buscarPorNumeroEmpleado(numeroEmpleado: string): Promise<Trabajador | null> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<TrabajadorRow>(
      `SELECT ${SELECT_COLUMNS} FROM trabajadores WHERE numero_empleado = ? LIMIT 1`,
      [numeroEmpleado],
    );

    return row ? toEntity(row) : null;
  }

  async buscarPorId(id: string): Promise<Trabajador | null> {
    const db = await getDatabase();

    const row = await db.getFirstAsync<TrabajadorRow>(
      `SELECT ${SELECT_COLUMNS} FROM trabajadores WHERE id = ? LIMIT 1`,
      [id],
    );

    return row ? toEntity(row) : null;
  }

  async crear(trabajador: Trabajador): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      `
      INSERT INTO trabajadores
      (id, numero_empleado, nombre, apellido_paterno, apellido_materno, activo)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        trabajador.id,
        trabajador.numeroEmpleado,
        trabajador.nombre,
        trabajador.apellidoPaterno,
        trabajador.apellidoMaterno,
        trabajador.activo ? 1 : 0,
      ],
    );
  }

  async actualizar(trabajador: Trabajador): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
      `
      UPDATE trabajadores
      SET numero_empleado = ?, nombre = ?, apellido_paterno = ?, apellido_materno = ?, activo = ?
      WHERE id = ?
      `,
      [
        trabajador.numeroEmpleado,
        trabajador.nombre,
        trabajador.apellidoPaterno,
        trabajador.apellidoMaterno,
        trabajador.activo ? 1 : 0,
        trabajador.id,
      ],
    );
  }

  async eliminar(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE trabajadores SET activo = 0 WHERE id = ?", [id]);
  }
}
