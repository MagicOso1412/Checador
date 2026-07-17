import { generateId } from "../../utils/uuid";
import { getDatabase } from "../db";

/** Datos de ejemplo para desarrollo. Movido desde database/seeds.ts (deprecado). */
export async function seedTrabajadores() {
  const db = await getDatabase();

  const result = (await db.getFirstAsync("SELECT COUNT(*) as total FROM trabajadores")) as any;

  if (result.total > 0) {
    return;
  }

  const trabajadores = [
    { numeroEmpleado: "1001", nombre: "Juan", apellidoPaterno: "Pérez", apellidoMaterno: "Gómez" },
    { numeroEmpleado: "1002", nombre: "Pedro", apellidoPaterno: "López", apellidoMaterno: "Martínez" },
  ];

  for (const trabajador of trabajadores) {
    await db.runAsync(
      `
        INSERT INTO trabajadores
        (
            id,
            numero_empleado,
            nombre,
            apellido_paterno,
            apellido_materno
        )
        VALUES
        (?, ?, ?, ?, ?)
        `,
      [
        generateId(),
        trabajador.numeroEmpleado,
        trabajador.nombre,
        trabajador.apellidoPaterno,
        trabajador.apellidoMaterno,
      ],
    );
  }

  console.log("[seeds] trabajadores sembrados");
}
