import { Router } from "express";
import { getDatabase } from "../db/db";
import { buscarAsistencias, type FiltrosAsistencias } from "../db/asistenciasQueries";
import { esAsistenciaSyncPayloadValido } from "../dto/AsistenciaSyncPayload";
import { generarCsv } from "../lib/csv";
import { apiKeyAuth } from "../middleware/apiKeyAuth";
import { jwtAuth } from "../middleware/jwtAuth";

export const asistenciasRouter = Router();

const ETIQUETAS_TIPO_REGISTRO: Record<string, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  INICIO_COMIDA: "Comida Inicio",
  FIN_COMIDA: "Comida Fin",
};

function leerFiltros(query: Record<string, unknown>): FiltrosAsistencias {
  const limite = typeof query.limite === "string" ? Number(query.limite) : undefined;

  return {
    proyectoId: typeof query.proyectoId === "string" ? query.proyectoId : undefined,
    trabajadorId: typeof query.trabajadorId === "string" ? query.trabajadorId : undefined,
    desde: typeof query.desde === "string" ? query.desde : undefined,
    hasta: typeof query.hasta === "string" ? query.hasta : undefined,
    limite: Number.isFinite(limite) ? limite : undefined,
  };
}

interface AsistenciaExistenteRow {
  id: string;
}

/**
 * Recibe una asistencia sincronizada desde un dispositivo
 * (`HttpSyncGateway` del cliente). Idempotente por `id`: si ya existe,
 * responde `200` sin volver a insertar — un dispositivo puede reintentar un
 * envío cuya respuesta no le llegó, y no debe duplicarse el registro.
 */
asistenciasRouter.post("/api/asistencias", apiKeyAuth, (req, res) => {
  const payload = req.body;

  if (!esAsistenciaSyncPayloadValido(payload)) {
    res.status(400).json({ error: "Payload inválido: revisa los campos y tipos requeridos" });
    return;
  }

  const db = getDatabase();

  const existente = db
    .prepare<[string], AsistenciaExistenteRow>("SELECT id FROM asistencias WHERE id = ?")
    .get(payload.id);

  if (existente) {
    res.status(200).json({ status: "ya existía", id: payload.id });
    return;
  }

  db.prepare(
    `
    INSERT INTO asistencias (
      id, trabajador_id, trabajador_nombre, numero_empleado,
      proyecto_id, proyecto_nombre, tipo_registro, fecha_hora, foto_uri,
      latitud, longitud, dispositivo_id, recibido_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    payload.id,
    payload.trabajadorId,
    payload.trabajadorNombre,
    payload.numeroEmpleado,
    payload.proyectoId,
    payload.proyectoNombre,
    payload.tipoRegistro,
    payload.fechaHora,
    payload.fotoUri,
    payload.latitud,
    payload.longitud,
    res.locals.dispositivoId ?? null,
    new Date().toISOString(),
  );

  res.status(201).json({ status: "creado", id: payload.id });
});

/**
 * Lista filtrable para el portal RH: `?proyectoId=&trabajadorId=&desde=&hasta=&limite=`
 * (todos opcionales, `desde`/`hasta` en ISO 8601). Protegida con `jwtAuth`
 * (sesión de RH), no con `apiKeyAuth` (dispositivos) — son consumidores
 * distintos con auth distinta a propósito.
 */
asistenciasRouter.get("/api/asistencias", jwtAuth, (req, res) => {
  const filtros = leerFiltros(req.query as Record<string, unknown>);
  const registros = buscarAsistencias(filtros);
  res.json({ total: registros.length, registros });
});

/**
 * Mismo filtro que el endpoint anterior, pero como descarga CSV — el "ver o
 * descargar" que RH necesita según la visión del proyecto. Mismo generador
 * de CSV (`lib/csv.ts`) que usa el cliente para su propia exportación local.
 */
asistenciasRouter.get("/api/asistencias/export.csv", jwtAuth, (req, res) => {
  const filtros = leerFiltros(req.query as Record<string, unknown>);
  const registros = buscarAsistencias(filtros);

  const csv = generarCsv(
    ["Trabajador", "Número de empleado", "Proyecto", "Tipo de registro", "Fecha", "Hora", "Dispositivo"],
    registros.map((r) => {
      const fecha = new Date(r.fecha_hora);
      return [
        r.trabajador_nombre,
        r.numero_empleado,
        r.proyecto_nombre,
        ETIQUETAS_TIPO_REGISTRO[r.tipo_registro] ?? r.tipo_registro,
        fecha.toLocaleDateString("es-MX"),
        fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
        r.dispositivo_id ?? "—",
      ];
    }),
  );

  const fecha = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="asistencias_${fecha}.csv"`);
  res.send(csv);
});
