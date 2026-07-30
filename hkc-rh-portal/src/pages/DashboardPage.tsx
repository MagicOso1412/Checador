import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, descargarAsistenciasCsv, descargarAsistenciasExcel, obtenerAsistencias } from "../api/client";
import type { AsistenciaRow } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { calcularResumen } from "../lib/estadisticas";

const ETIQUETAS_TIPO: Record<AsistenciaRow["tipo_registro"], string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  INICIO_COMIDA: "Comida inicio",
  FIN_COMIDA: "Comida fin",
};

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return `${fecha.toLocaleDateString("es-MX")} ${fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
}

export function DashboardPage() {
  const { token, usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const [registros, setRegistros] = useState<AsistenciaRow[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState<"csv" | "xlsx" | null>(null);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const manejarErrorApi = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      cerrarSesion();
      navigate("/login", { replace: true });
      return;
    }
    setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
  };

  const buscar = async () => {
    if (!token) return;
    setCargando(true);
    setError(null);
    try {
      const { registros } = await obtenerAsistencias(token, {
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      setRegistros(registros);
    } catch (err) {
      manejarErrorApi(err);
    } finally {
      setCargando(false);
    }
  };

  // Primera carga: últimos registros sin filtro de fecha.
  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return registros;
    return registros.filter(
      (r) =>
        r.trabajador_nombre.toLowerCase().includes(term) ||
        r.proyecto_nombre.toLowerCase().includes(term) ||
        r.numero_empleado.toLowerCase().includes(term),
    );
  }, [registros, busqueda]);

  // Sobre `registros` (todo el rango de fechas filtrado), no sobre
  // `filtrados` (búsqueda local de la tabla) — ver nota en `lib/estadisticas.ts`.
  const resumen = useMemo(() => calcularResumen(registros), [registros]);

  const handleDescargar = async (formato: "csv" | "xlsx") => {
    if (!token) return;
    setDescargando(formato);
    setError(null);
    try {
      const filtros = { desde: desde || undefined, hasta: hasta || undefined };
      if (formato === "csv") {
        await descargarAsistenciasCsv(token, filtros);
      } else {
        await descargarAsistenciasExcel(token, filtros);
      }
    } catch (err) {
      manejarErrorApi(err);
    } finally {
      setDescargando(null);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>HKC Attendance</h1>
          <p className="subtitle">Portal de Recursos Humanos</p>
        </div>
        <div className="header-right">
          <span className="usuario-nombre">{usuario?.nombre}</span>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              cerrarSesion();
              navigate("/login", { replace: true });
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="filtros">
        <div className="campo">
          <label htmlFor="desde">Desde</label>
          <input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="hasta">Hasta</label>
          <input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <button type="button" onClick={buscar} disabled={cargando}>
          {cargando ? "Buscando…" : "Buscar"}
        </button>

        <div className="campo campo-busqueda">
          <label htmlFor="busqueda">Buscar trabajador o proyecto</label>
          <input
            id="busqueda"
            type="text"
            placeholder="Nombre, número de empleado o proyecto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <button type="button" className="secondary" onClick={() => handleDescargar("csv")} disabled={descargando !== null}>
          {descargando === "csv" ? "Descargando…" : "Descargar CSV"}
        </button>
        <button type="button" className="secondary" onClick={() => handleDescargar("xlsx")} disabled={descargando !== null}>
          {descargando === "xlsx" ? "Descargando…" : "Descargar Excel"}
        </button>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="resumen">
        <ResumenChip etiqueta="Total" valor={resumen.total} />
        <ResumenChip etiqueta="Trabajadores" valor={resumen.trabajadoresUnicos} />
        <ResumenChip etiqueta="Proyectos" valor={resumen.proyectosUnicos} />
        <ResumenChip etiqueta="Entradas" valor={resumen.porTipo.ENTRADA} />
        <ResumenChip etiqueta="Salidas" valor={resumen.porTipo.SALIDA} />
        <ResumenChip etiqueta="Comida (inicio/fin)" valor={resumen.porTipo.INICIO_COMIDA + resumen.porTipo.FIN_COMIDA} />
      </section>

      <section className="tabla-wrapper">
        {cargando ? (
          <p className="estado-vacio">Cargando…</p>
        ) : filtrados.length === 0 ? (
          <p className="estado-vacio">No hay registros para estos filtros.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Núm. empleado</th>
                <th>Proyecto</th>
                <th>Tipo</th>
                <th>Fecha y hora</th>
                <th>Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id}>
                  <td>{r.trabajador_nombre}</td>
                  <td>{r.numero_empleado}</td>
                  <td>{r.proyecto_nombre}</td>
                  <td>{ETIQUETAS_TIPO[r.tipo_registro]}</td>
                  <td>{formatearFecha(r.fecha_hora)}</td>
                  <td>{r.dispositivo_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="total-registros">{filtrados.length} de {registros.length} registros mostrados</p>
    </div>
  );
}

function ResumenChip({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="resumen-chip">
      <span className="resumen-valor">{valor}</span>
      <span className="resumen-etiqueta">{etiqueta}</span>
    </div>
  );
}
