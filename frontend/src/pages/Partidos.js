import React, { useEffect, useMemo, useState } from 'react';
import LigaSelector from '../components/LigaSelector';
import { useAccess } from '../contexts/AccessContext';
import { useLiga } from '../contexts/LigaContext';
import {
  equiposAPI,
  jugadorasAPI,
  partidosAPI,
  extractApiErrorMessage,
} from '../services/api';
import './Partidos.css';

const CANCHAS_DISPONIBLES = ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4'];

const Partidos = () => {
  const { isAdmin } = useAccess();
  const { temporadaActual, ligaActual } = useLiga();

  const [partidos, setPartidos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [jugadoras, setJugadoras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [partidoForm, setPartidoForm] = useState({
    equipoLocalId: '',
    equipoVisitaId: '',
    jornada: '1',
    fecha: '',
    cancha: '',
  });
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState('TODAS');

  const [editorPartidoId, setEditorPartidoId] = useState(null);
  const [golesEditor, setGolesEditor] = useState([]);
  const [asistenciaEditor, setAsistenciaEditor] = useState({});
  const [equipoGol, setEquipoGol] = useState('local');
  const [jugadoraGolId, setJugadoraGolId] = useState('');

  const cargarPartidos = async () => {
    if (!temporadaActual?.id) {
      setPartidos([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await partidosAPI.getByTemporada(temporadaActual.id);
      setPartidos(response.data);
    } catch (err) {
      setError(`No fue posible cargar partidos: ${extractApiErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPartidos();
  }, [temporadaActual?.id]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      if (!temporadaActual?.id || !isAdmin) {
        setEquipos([]);
        setJugadoras([]);
        return;
      }
      try {
        const [eq, ju] = await Promise.all([
          equiposAPI.getByTemporada(temporadaActual.id),
          jugadorasAPI.getAll({ temporadaId: temporadaActual.id }),
        ]);
        setEquipos(eq.data);
        setJugadoras(ju.data);
      } catch {
        setEquipos([]);
        setJugadoras([]);
      }
    };
    cargarCatalogos();
  }, [temporadaActual?.id, isAdmin]);

  const formatFecha = (iso) =>
    new Date(iso).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const crearPartido = async (e) => {
    e.preventDefault();
    if (!temporadaActual?.id) return;
    setError('');
    setOk('');
    try {
      await partidosAPI.create({
        temporadaId: temporadaActual.id,
        equipoLocalId: Number(partidoForm.equipoLocalId),
        equipoVisitaId: Number(partidoForm.equipoVisitaId),
        jornada: Number(partidoForm.jornada),
        fecha: partidoForm.fecha,
        cancha: partidoForm.cancha || null,
      });
      setPartidoForm({
        equipoLocalId: '',
        equipoVisitaId: '',
        jornada: '1',
        fecha: '',
        cancha: '',
      });
      setOk('Partido programado.');
      await cargarPartidos();
    } catch (err) {
      setError(`No fue posible programar partido: ${extractApiErrorMessage(err)}`);
    }
  };

  const abrirEditor = (partido) => {
    const jugadorasPartido = jugadoras.filter(
      (j) => j.equipoId === partido.equipoLocalId || j.equipoId === partido.equipoVisitaId,
    );
    const asistenciaInicial = {};
    jugadorasPartido.forEach((j) => {
      asistenciaInicial[j.id] = false;
    });

    setEditorPartidoId(partido.id);
    setGolesEditor(
      (partido.goles || []).map((g) => ({
        jugadoraId: g.jugadoraId,
        equipoId: g.equipoId,
        nombre: g.jugadora?.nombre || null,
      })),
    );
    setAsistenciaEditor(asistenciaInicial);
    setEquipoGol('local');
    setJugadoraGolId('');
  };

  const cerrarEditor = () => {
    setEditorPartidoId(null);
    setGolesEditor([]);
    setAsistenciaEditor({});
    setJugadoraGolId('');
  };

  const jugadorasPorId = useMemo(() => new Map(jugadoras.map((j) => [j.id, j])), [jugadoras]);
  const jornadasDisponibles = useMemo(
    () =>
      [...new Set(partidos.map((partido) => Number(partido.jornada)))]
        .filter((jornada) => Number.isFinite(jornada))
        .sort((a, b) => a - b),
    [partidos],
  );
  const partidosFiltrados = useMemo(() => {
    if (jornadaSeleccionada === 'TODAS') return partidos;
    return partidos.filter((partido) => Number(partido.jornada) === Number(jornadaSeleccionada));
  }, [partidos, jornadaSeleccionada]);

  const jugadorasParaEquipo = (partido) => {
    const teamId = equipoGol === 'local' ? partido.equipoLocalId : partido.equipoVisitaId;
    return jugadoras.filter((j) => j.equipoId === teamId && asistenciaEditor[j.id]);
  };

  const jugadorasPorEquipoEnPartido = (partido) => ({
    local: jugadoras.filter((j) => j.equipoId === partido.equipoLocalId),
    visita: jugadoras.filter((j) => j.equipoId === partido.equipoVisitaId),
  });

  const toggleAsistencia = (jugadoraId) => {
    setAsistenciaEditor((prev) => ({ ...prev, [jugadoraId]: !prev[jugadoraId] }));
  };

  const agregarGol = () => {
    if (!jugadoraGolId) return;
    const jugadora = jugadorasPorId.get(Number(jugadoraGolId));
    setGolesEditor((prev) => [
      ...prev,
      {
        jugadoraId: Number(jugadoraGolId),
        equipoId: jugadora?.equipoId || null,
        nombre: jugadora?.nombre || null,
      },
    ]);
    setJugadoraGolId('');
  };

  const quitarGol = (index) => {
    setGolesEditor((prev) => prev.filter((_, i) => i !== index));
  };

  const guardarResultado = async (partidoId) => {
    setError('');
    setOk('');
    try {
      const response = await partidosAPI.registrarResultado(partidoId, { goles: golesEditor });
      setPartidos((prev) =>
        prev.map((partido) => (partido.id === partidoId ? response.data : partido)),
      );
      setOk('Resultado guardado.');
      cerrarEditor();
    } catch (err) {
      setError(`No fue posible guardar resultado: ${extractApiErrorMessage(err)}`);
    }
  };

  const conteoGoles = (partido) => {
    let local = 0;
    let visita = 0;
    for (const goal of golesEditor) {
      const player = jugadorasPorId.get(Number(goal.jugadoraId));
      const equipoId = player?.equipoId || goal.equipoId;
      if (equipoId === partido.equipoLocalId) local += 1;
      if (equipoId === partido.equipoVisitaId) visita += 1;
    }
    return { local, visita };
  };

  return (
    <div className="partidos-container">
      <LigaSelector />
      <header className="partidos-header">
        <h2>
          Partidos: {ligaActual?.nombre} {temporadaActual ? `- ${temporadaActual.nombre}` : ''}
        </h2>
        <p>Control de jornadas, resultados y seguimiento operativo en una sola vista.</p>
      </header>

      {error && <div className="error-message">{error}</div>}
      {ok && <div className="success-message">{ok}</div>}
      {loading && <div className="loading-spinner">Cargando partidos...</div>}

      {isAdmin && !!temporadaActual && (
        <div className="modal-content partido-programar">
          <h3>Programar Partido</h3>
          <form onSubmit={crearPartido} className="partido-programar-form">
            <div className="form-group">
              <label>Jornada</label>
              <input
                type="number"
                min="1"
                value={partidoForm.jornada}
                onChange={(e) => setPartidoForm({ ...partidoForm, jornada: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Fecha y hora</label>
              <input
                type="datetime-local"
                value={partidoForm.fecha}
                onChange={(e) => setPartidoForm({ ...partidoForm, fecha: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Cancha</label>
              <select
                value={partidoForm.cancha}
                onChange={(e) => setPartidoForm({ ...partidoForm, cancha: e.target.value })}
                required
              >
                <option value="">Selecciona cancha</option>
                {CANCHAS_DISPONIBLES.map((cancha) => (
                  <option key={cancha} value={cancha}>
                    {cancha}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Equipo Local</label>
              <select
                value={partidoForm.equipoLocalId}
                onChange={(e) => setPartidoForm({ ...partidoForm, equipoLocalId: e.target.value })}
                required
              >
                <option value="">Selecciona equipo</option>
                {equipos.map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Equipo Visita</label>
              <select
                value={partidoForm.equipoVisitaId}
                onChange={(e) => setPartidoForm({ ...partidoForm, equipoVisitaId: e.target.value })}
                required
              >
                <option value="">Selecciona equipo</option>
                {equipos.map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Programar Partido
            </button>
          </form>
        </div>
      )}

      {!loading && !partidos.length && (
        <div className="no-data">No hay partidos para esta temporada.</div>
      )}

      {!!partidos.length && (
        <div className="jornada-filtro">
          <label htmlFor="jornadaFiltro">Jornada</label>
          <select
            id="jornadaFiltro"
            value={jornadaSeleccionada}
            onChange={(e) => setJornadaSeleccionada(e.target.value)}
          >
            <option value="TODAS">Todas las jornadas</option>
            {jornadasDisponibles.map((jornada) => (
              <option key={jornada} value={String(jornada)}>
                Jornada {jornada}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="partidos-grid">
        {partidosFiltrados.map((partido) => {
          const isLive = editorPartidoId === partido.id;
          const marcador = isLive
            ? conteoGoles(partido)
            : { local: partido.golesLocal, visita: partido.golesVisita };
          const estadoClase = isLive
            ? 'is-vivo'
            : partido.status === 'JUGADO'
              ? 'is-finalizado'
              : 'is-programado';
          const estadoTexto = isLive ? 'En vivo' : partido.status === 'JUGADO' ? 'Finalizado' : 'Programado';

          return (
            <div key={partido.id} className={`partido-card ${partido.status === 'JUGADO' ? 'jugado' : ''}`}>
              <div className="partido-header">
                <span className="partido-meta">Jornada {partido.jornada}</span>
                <span className="partido-fecha">{formatFecha(partido.fecha)}</span>
                <span className={`estado-pill ${estadoClase}`}>{estadoTexto}</span>
              </div>
              <div className="partido-info">
                <span className="team-name local">{partido.equipoLocal.nombre}</span>
                <div className="scoreboard">
                  <span className="score score-animate" key={`${partido.id}-${marcador.local}-${marcador.visita}`}>
                    {marcador.local} - {marcador.visita}
                  </span>
                  <span className="score-label">Marcador</span>
                </div>
                <span className="team-name visita">{partido.equipoVisita.nombre}</span>
              </div>

              {isAdmin && (
                <div className="partido-admin">
                  {editorPartidoId !== partido.id ? (
                    <button className="btn-primary" onClick={() => abrirEditor(partido)}>
                      {partido.status === 'PROGRAMADO' ? 'Iniciar Partido' : 'Gestionar Resultado'}
                    </button>
                  ) : (
                    <div className="resultado-editor">
                      <h4>Resultado en vivo</h4>
                      <div className="score-live">
                        <span>
                          {partido.equipoLocal.nombre} {marcador.local} - {marcador.visita}{' '}
                          {partido.equipoVisita.nombre}
                        </span>
                      </div>

                      <div className="asistencia-wrap">
                        {(() => {
                          const listas = jugadorasPorEquipoEnPartido(partido);
                          return (
                            <>
                              <div className="asistencia-col">
                                <div className="asistencia-head">
                                  {partido.equipoLocal.nombre} ({listas.local.filter((j) => asistenciaEditor[j.id]).length}/
                                  {listas.local.length})
                                </div>
                                <ul className="asistencia-list">
                                  {listas.local.map((jugadora) => (
                                    <li key={jugadora.id} className="asistencia-item">
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={!!asistenciaEditor[jugadora.id]}
                                          onChange={() => toggleAsistencia(jugadora.id)}
                                        />
                                        <span className="checkmark" />
                                        <span className="asistencia-texto">
                                          {jugadora.nombre}
                                          {jugadora.dorsal ? ` #${jugadora.dorsal}` : ''}
                                        </span>
                                      </label>
                                    </li>
                                  ))}
                                  {!listas.local.length && <li className="asistencia-empty">Sin jugadoras registradas</li>}
                                </ul>
                              </div>

                              <div className="asistencia-col">
                                <div className="asistencia-head">
                                  {partido.equipoVisita.nombre} ({listas.visita.filter((j) => asistenciaEditor[j.id]).length}/
                                  {listas.visita.length})
                                </div>
                                <ul className="asistencia-list">
                                  {listas.visita.map((jugadora) => (
                                    <li key={jugadora.id} className="asistencia-item">
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={!!asistenciaEditor[jugadora.id]}
                                          onChange={() => toggleAsistencia(jugadora.id)}
                                        />
                                        <span className="checkmark" />
                                        <span className="asistencia-texto">
                                          {jugadora.nombre}
                                          {jugadora.dorsal ? ` #${jugadora.dorsal}` : ''}
                                        </span>
                                      </label>
                                    </li>
                                  ))}
                                  {!listas.visita.length && <li className="asistencia-empty">Sin jugadoras registradas</li>}
                                </ul>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div className="goal-row">
                        <select value={equipoGol} onChange={(e) => setEquipoGol(e.target.value)}>
                          <option value="local">Gol {partido.equipoLocal.nombre}</option>
                          <option value="visita">Gol {partido.equipoVisita.nombre}</option>
                        </select>
                        <select value={jugadoraGolId} onChange={(e) => setJugadoraGolId(e.target.value)}>
                          <option value="">Selecciona jugadora presente</option>
                          {jugadorasParaEquipo(partido).map((jugadora) => (
                            <option key={jugadora.id} value={jugadora.id}>
                              {jugadora.nombre}
                              {jugadora.dorsal ? ` #${jugadora.dorsal}` : ''}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="btn-primary" onClick={agregarGol}>
                          + Gol
                        </button>
                      </div>

                      <ul className="goles-lista">
                        {golesEditor.map((g, idx) => {
                          const player = jugadorasPorId.get(Number(g.jugadoraId));
                          return (
                            <li key={`${g.jugadoraId}-${idx}`}>
                              <span>{player?.nombre || g.nombre || `ID ${g.jugadoraId}`}</span>
                              <button type="button" className="btn-danger btn-danger-sm" onClick={() => quitarGol(idx)}>
                                Quitar
                              </button>
                            </li>
                          );
                        })}
                        {!golesEditor.length && <li>Sin goles capturados.</li>}
                      </ul>

                      <div className="editor-actions">
                        <button className="btn-primary" onClick={() => guardarResultado(partido.id)}>
                          Guardar Resultado
                        </button>
                        <button className="btn-secondary" onClick={cerrarEditor}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {!loading && !!partidos.length && !partidosFiltrados.length && (
          <div className="no-data">No hay partidos para la jornada seleccionada.</div>
        )}
      </div>
    </div>
  );
};

export default Partidos;
