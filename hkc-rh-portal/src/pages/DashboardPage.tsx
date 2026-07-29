import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, descargarAsistenciasCsv, obtenerAsistencias } from "../api/client";
import type { AsistenciaRow } from "../api/types";
import { useAuth } from "../context/AuthContext";

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
  const [descargando, setDescargando] = useState(false);

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

  const handleDescargar = async () => {
    if (!token) return;
    setDescargando(true);
    setError(null);
    try {
      await descargarAsistenciasCsv(token, { desde: desde || undefined, hasta: hasta || undefined });
    } catch (err) {
      manejarErrorApi(err);
    } finally {
      setDescargando(false);
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

        <button type="button" className="secondary" onClick={handleDescargar} disabled={descargando}>
          {descargando ? "Descargando…" : "Descargar CSV"}
        </button>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

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
