import { getDatabase } from "./db";

export async function seedTrabajadores() {

    const db = await getDatabase();

    const result = await db.getFirstAsync(
        "SELECT COUNT(*) as total FROM trabajadores"
    ) as any;

    if (result.total > 0) {
        return;
    }

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
            "1",
            "1001",
            "Juan",
            "Pérez",
            "Gómez"
        ]
    );

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
            "2",
            "1002",
            "Pedro",
            "López",
            "Martínez"
        ]
    );

    console.log("Seeds ejecutados");
}