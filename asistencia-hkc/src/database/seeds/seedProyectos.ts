import { generateId } from "../../utils/uuid";
import { getDatabase } from "../db";

/** Datos de ejemplo para desarrollo, mientras no exista un CRUD real de proyectos (Sprint 3). */
export async function seedProyectos() {
  const db = await getDatabase();

  const result = (await db.getFirstAsync("SELECT COUNT(*) as total FROM proyectos")) as any;

  if (result.total > 0) {
    return;
  }

  const proyectos = [
    "Torre Residencial Bosques",
    "Puente Vehicular Km 34",
    "Centro Comercial Arcos",
    "Planta Industrial Sigma",
    "Boulevard Zona Tec",
  ];

  for (const nombre of proyectos) {
    await db.runAsync("INSERT INTO proyectos (id, nombre, activo) VALUES (?, ?, 1)", [
      generateId(),
      nombre,
    ]);
  }

  console.log("[seeds] proyectos sembrados");
}
