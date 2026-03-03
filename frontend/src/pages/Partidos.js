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

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const Partidos = () => {
  const { role, canScoreMatches } = useAccess();
  const { temporadaActual, ligaActual } = useLiga();
  const canManageMatches = role === 'SUPER_ADMIN' || role === 'admin';

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
  const [partidoAEliminar, setPartidoAEliminar] = useState(null);

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
      setError(
        `No fue posible cargar partidos: ${extractApiErrorMessage(err)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPartidos();
  }, [temporadaActual?.id]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      if (!temporadaActual?.id || !canScoreMatches) {
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
  }, [temporadaActual?.id, canScoreMatches]);

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
      setError(
        `No fue posible programar partido: ${extractApiErrorMessage(err)}`,
      );
    }
  };

  const confirmarEliminarPartido = async () => {
    if (!partidoAEliminar) return;
    setError('');
    setOk('');
    try {
      await partidosAPI.delete(partidoAEliminar.id);
      if (editorPartidoId === partidoAEliminar.id) cerrarEditor();
      await cargarPartidos();
      setPartidoAEliminar(null);
      setOk('Partido eliminado. La tabla se recalculara con los partidos vigentes.');
    } catch (err) {
      setError(`No fue posible eliminar partido: ${extractApiErrorMessage(err)}`);
    }
  };

  const abrirEditor = (partido) => {
    const jugadorasPartido = jugadoras.filter(
      (j) =>
        j.equipoId === partido.equipoLocalId ||
        j.equipoId === partido.equipoVisitaId,
    );
    const asistenciaInicial = {};
    jugadorasPartido.forEach((j) => {
      asistenciaInicial[j.id] = {
        presente: false,
        tarjetaAmarilla: false,
        tarjetaRoja: false,
      };
    });
    (partido.asistencias || []).forEach((a) => {
      asistenciaInicial[a.jugadoraId] = {
        presente: Boolean(a.presente),
        tarjetaAmarilla: Boolean(a.tarjetaAmarilla),
        tarjetaRoja: Boolean(a.tarjetaRoja),
      };
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

  const jugadorasPorId = useMemo(
    () => new Map(jugadoras.map((j) => [j.id, j])),
    [jugadoras],
  );
  const jornadasDisponibles = useMemo(
    () =>
      [...new Set(partidos.map((partido) => Number(partido.jornada)))]
        .filter((jornada) => Number.isFinite(jornada))
        .sort((a, b) => a - b),
    [partidos],
  );
  const partidosFiltrados = useMemo(() => {
    if (jornadaSeleccionada === 'TODAS') return partidos;
    return partidos.filter(
      (partido) => Number(partido.jornada) === Number(jornadaSeleccionada),
    );
  }, [partidos, jornadaSeleccionada]);

  const jugadorasParaEquipo = (partido) => {
    const teamId =
      equipoGol === 'local' ? partido.equipoLocalId : partido.equipoVisitaId;
    return jugadoras.filter(
      (j) => j.equipoId === teamId && asistenciaEditor[j.id]?.presente,
    );
  };

  const jugadorasPorEquipoEnPartido = (partido) => ({
    local: jugadoras.filter((j) => j.equipoId === partido.equipoLocalId),
    visita: jugadoras.filter((j) => j.equipoId === partido.equipoVisitaId),
  });

  const toggleAsistencia = (jugadoraId) => {
    setAsistenciaEditor((prev) => ({
      ...prev,
      [jugadoraId]: {
        presente: !prev[jugadoraId]?.presente,
        tarjetaAmarilla: Boolean(prev[jugadoraId]?.tarjetaAmarilla),
        tarjetaRoja: Boolean(prev[jugadoraId]?.tarjetaRoja),
      },
    }));
  };

  const toggleTarjeta = (jugadoraId, tipo) => {
    setAsistenciaEditor((prev) => ({
      ...prev,
      [jugadoraId]: {
        presente: Boolean(prev[jugadoraId]?.presente),
        tarjetaAmarilla:
          tipo === 'amarilla'
            ? !prev[jugadoraId]?.tarjetaAmarilla
            : Boolean(prev[jugadoraId]?.tarjetaAmarilla),
        tarjetaRoja:
          tipo === 'roja'
            ? !prev[jugadoraId]?.tarjetaRoja
            : Boolean(prev[jugadoraId]?.tarjetaRoja),
      },
    }));
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
      const response = await partidosAPI.registrarResultado(partidoId, {
        goles: golesEditor,
        asistencias: Object.entries(asistenciaEditor).map(([jugadoraId, estado]) => ({
          jugadoraId: Number(jugadoraId),
          presente: Boolean(estado?.presente),
          tarjetaAmarilla: Boolean(estado?.tarjetaAmarilla),
          tarjetaRoja: Boolean(estado?.tarjetaRoja),
        })),
      });
      setPartidos((prev) =>
        prev.map((partido) =>
          partido.id === partidoId ? response.data : partido,
        ),
      );
      setOk('Resultado guardado.');
      cerrarEditor();
    } catch (err) {
      setError(
        `No fue posible guardar resultado: ${extractApiErrorMessage(err)}`,
      );
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

  const descargarCedulaPdf = (partido) => {
    const fechaMatch = new Date(partido.fecha);
    const dia = fechaMatch.toLocaleDateString('es-MX', { weekday: 'long' });
    const fecha = fechaMatch.toLocaleDateString('es-MX');
    const hora = fechaMatch.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const asistenciaMap = new Map(
      (partido.asistencias || []).map((item) => [
        item.jugadoraId,
        {
          presente: Boolean(item.presente),
          tarjetaAmarilla: Boolean(item.tarjetaAmarilla),
          tarjetaRoja: Boolean(item.tarjetaRoja),
        },
      ]),
    );
    const golesPorJugadora = new Map();
    (partido.goles || []).forEach((gol) => {
      const jugadoraId = Number(gol.jugadoraId);
      golesPorJugadora.set(
        jugadoraId,
        (golesPorJugadora.get(jugadoraId) || 0) + 1,
      );
    });

    const jugadorasLocal = jugadoras.filter((j) => j.equipoId === partido.equipoLocalId);
    const jugadorasVisita = jugadoras.filter((j) => j.equipoId === partido.equipoVisitaId);

    const buildRows = (listaJugadoras) => {
      const rows = listaJugadoras.map((jugadora) => `
        <tr>
          <td class="col-no">${escapeHtml(jugadora.dorsal ?? '')}</td>
          <td class="col-name">${escapeHtml(jugadora.nombre)}</td>
          <td class="col-mini">${golesPorJugadora.get(jugadora.id) || ''}</td>
          <td class="col-mini">${asistenciaMap.get(jugadora.id)?.tarjetaAmarilla ? 'X' : ''}</td>
          <td class="col-mini">${asistenciaMap.get(jugadora.id)?.tarjetaRoja ? 'X' : ''}</td>
        </tr>
      `);

      while (rows.length < 14) {
        rows.push(`
          <tr>
            <td class="col-no">&nbsp;</td>
            <td class="col-name">&nbsp;</td>
            <td class="col-mini"></td>
            <td class="col-mini"></td>
            <td class="col-mini"></td>
          </tr>
        `);
      }
      return rows.join('');
    };

    const html = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Cedula Arbitral - ${escapeHtml(partido.equipoLocal.nombre)} vs ${escapeHtml(partido.equipoVisita.nombre)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #111; }
    .sheet { width: 100%; }
    .head { display: grid; grid-template-columns: 170px 1fr; gap: 14px; align-items: start; margin-bottom: 8px; }
    .logo { border: 2px solid #111; border-radius: 10px; height: 120px; display: grid; place-items: center; font-weight: 800; font-size: 28px; }
    .meta { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .meta-box { border: 2px solid #111; min-height: 52px; }
    .meta-label { border-bottom: 2px solid #111; font-weight: 800; text-align: center; padding: 2px 4px; }
    .meta-value { text-align: center; padding: 6px 4px; text-transform: capitalize; }
    .title { text-align: center; font-size: 36px; font-weight: 900; margin: 8px 0 6px; letter-spacing: 0.6px; }
    .subtitle { text-align: center; font-size: 17px; font-weight: 700; margin: 0 0 12px; }
    .teams { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .team-box { border: 2px solid #111; }
    .team-head { display: grid; grid-template-columns: 1fr auto; border-bottom: 2px solid #111; }
    .team-title { padding: 6px 8px; font-weight: 800; }
    .team-score { padding: 6px 12px; border-left: 2px solid #111; font-weight: 900; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1.7px solid #111; padding: 3px 5px; height: 24px; }
    th { font-size: 14px; }
    .col-no { width: 58px; text-align: center; }
    .col-name { text-align: left; }
    .col-mini { width: 46px; text-align: center; }
    .legend { margin-top: 8px; font-size: 12px; }
    .foot { margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .sign { border-top: 2px solid #111; padding-top: 6px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="logo">SOCCER<br/>GDL</div>
      <div class="meta">
        <div class="meta-box"><div class="meta-label">DIA</div><div class="meta-value">${escapeHtml(dia)}</div></div>
        <div class="meta-box"><div class="meta-label">FECHA</div><div class="meta-value">${escapeHtml(fecha)}</div></div>
        <div class="meta-box"><div class="meta-label">JORNADA</div><div class="meta-value">${escapeHtml(partido.jornada)}</div></div>
        <div class="meta-box"><div class="meta-label">CANCHA</div><div class="meta-value">${escapeHtml(partido.cancha || '-')}</div></div>
        <div class="meta-box"><div class="meta-label">HORA</div><div class="meta-value">${escapeHtml(hora)}</div></div>
      </div>
    </div>

    <div class="title">CEDULA ARBITRAL</div>
    <div class="subtitle">
      MARCADOR FINAL: ${escapeHtml(partido.equipoLocal.nombre)} ${partido.golesLocal} - ${partido.golesVisita} ${escapeHtml(partido.equipoVisita.nombre)}
    </div>

    <div class="teams">
      <div class="team-box">
        <div class="team-head">
          <div class="team-title">${escapeHtml(partido.equipoLocal.nombre)}</div>
          <div class="team-score">${partido.golesLocal}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-no">NO.</th>
              <th class="col-name">NOMBRE/APELLIDO</th>
              <th class="col-mini">GOL</th>
              <th class="col-mini">T/A</th>
              <th class="col-mini">T/R</th>
            </tr>
          </thead>
          <tbody>
            ${buildRows(jugadorasLocal)}
          </tbody>
        </table>
      </div>

      <div class="team-box">
        <div class="team-head">
          <div class="team-title">${escapeHtml(partido.equipoVisita.nombre)}</div>
          <div class="team-score">${partido.golesVisita}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-no">NO.</th>
              <th class="col-name">NOMBRE/APELLIDO</th>
              <th class="col-mini">GOL</th>
              <th class="col-mini">T/A</th>
              <th class="col-mini">T/R</th>
            </tr>
          </thead>
          <tbody>
            ${buildRows(jugadorasVisita)}
          </tbody>
        </table>
      </div>
    </div>

    <div class="legend">T/A = Tarjeta amarilla. T/R = Tarjeta roja.</div>

    <div class="foot">
      <div class="sign">Firma Arbitro</div>
      <div class="sign">Firma Anotador</div>
    </div>
  </div>
</body>
</html>`;

    const popup = window.open('', '_blank', 'width=1200,height=900');
    if (!popup) {
      setError('Tu navegador bloqueo la ventana para imprimir PDF. Habilita popups.');
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => {
      popup.print();
    }, 300);
  };

  return (
    <div className="partidos-container">
      <LigaSelector />
      <header className="partidos-header">
        <h2>
          Partidos: {ligaActual?.nombre}{' '}
          {temporadaActual ? `- ${temporadaActual.nombre}` : ''}
        </h2>
        <p>
          Control de jornadas, resultados y seguimiento operativo en una sola
          vista.
        </p>
      </header>

      {error && <div className="error-message">{error}</div>}
      {ok && <div className="success-message">{ok}</div>}
      {loading && <div className="loading-spinner">Cargando partidos...</div>}

      {canManageMatches && !!temporadaActual && (
        <div className="modal-content partido-programar">
          <h3>Programar Partido</h3>
          <form onSubmit={crearPartido} className="partido-programar-form">
            <div className="form-group">
              <label>Jornada</label>
              <input
                type="number"
                min="1"
                value={partidoForm.jornada}
                onChange={(e) =>
                  setPartidoForm({ ...partidoForm, jornada: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Fecha y hora</label>
              <input
                type="datetime-local"
                value={partidoForm.fecha}
                onChange={(e) =>
                  setPartidoForm({ ...partidoForm, fecha: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Cancha</label>
              <select
                value={partidoForm.cancha}
                onChange={(e) =>
                  setPartidoForm({ ...partidoForm, cancha: e.target.value })
                }
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
                onChange={(e) =>
                  setPartidoForm({
                    ...partidoForm,
                    equipoLocalId: e.target.value,
                  })
                }
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
                onChange={(e) =>
                  setPartidoForm({
                    ...partidoForm,
                    equipoVisitaId: e.target.value,
                  })
                }
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
          const estadoTexto = isLive
            ? 'En vivo'
            : partido.status === 'JUGADO'
              ? 'Finalizado'
              : 'Programado';

          return (
            <div
              key={partido.id}
              className={`partido-card ${partido.status === 'JUGADO' ? 'jugado' : ''}`}
            >
              <div className="partido-header">
                <span className="partido-meta">Jornada {partido.jornada}</span>
                <span className="partido-fecha">
                  {formatFecha(partido.fecha)}
                </span>
                <span className={`estado-pill ${estadoClase}`}>
                  {estadoTexto}
                </span>
              </div>
              <div className="partido-info">
                <span className="team-name local">
                  {partido.equipoLocal.nombre}
                </span>
                <div className="scoreboard">
                  <span
                    className="score score-animate"
                    key={`${partido.id}-${marcador.local}-${marcador.visita}`}
                  >
                    {marcador.local} - {marcador.visita}
                  </span>
                  <span className="score-label">Marcador</span>
                </div>
                <span className="team-name visita">
                  {partido.equipoVisita.nombre}
                </span>
              </div>

              {canScoreMatches && (
                <div className="partido-admin">
                  {editorPartidoId !== partido.id ? (
                    <>
                      <button
                        className="btn-primary"
                        onClick={() => abrirEditor(partido)}
                      >
                        {partido.status === 'PROGRAMADO'
                          ? 'Iniciar Partido'
                          : 'Gestionar Resultado'}
                      </button>
                      {canManageMatches && (
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => setPartidoAEliminar(partido)}
                        >
                          Eliminar Partido
                        </button>
                      )}
                      {canManageMatches && partido.status === 'JUGADO' && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => descargarCedulaPdf(partido)}
                        >
                          Descargar Cedula PDF
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="resultado-editor">
                      <h4>Resultado en vivo</h4>
                      <div className="score-live">
                        <span>
                          {partido.equipoLocal.nombre} {marcador.local} -{' '}
                          {marcador.visita} {partido.equipoVisita.nombre}
                        </span>
                      </div>

                      <div className="asistencia-wrap">
                        {(() => {
                          const listas = jugadorasPorEquipoEnPartido(partido);
                          return (
                            <>
                              <div className="asistencia-col">
                                <div className="asistencia-head">
                                  {partido.equipoLocal.nombre} (
                                  {
                                    listas.local.filter(
                                      (j) => asistenciaEditor[j.id]?.presente,
                                    ).length
                                  }
                                  /{listas.local.length})
                                </div>
                                <div className="asistencia-columns">
                                  <span>Asistencia</span>
                                  <span title="Tarjeta amarilla">🟨</span>
                                  <span title="Tarjeta roja">🟥</span>
                                </div>
                                <ul className="asistencia-list">
                                  {listas.local.map((jugadora) => (
                                    <li
                                      key={jugadora.id}
                                      className="asistencia-item"
                                    >
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={
                                            !!asistenciaEditor[jugadora.id]?.presente
                                          }
                                          onChange={() =>
                                            toggleAsistencia(jugadora.id)
                                          }
                                        />
                                        <span className="checkmark" />
                                        <span className="asistencia-texto">
                                          {jugadora.nombre}
                                          {jugadora.dorsal
                                            ? ` #${jugadora.dorsal}`
                                            : ''}
                                        </span>
                                      </label>
                                      <div className="asistencia-cards">
                                        <label className="card-toggle yellow" title="Tarjeta amarilla">
                                          <input
                                            type="checkbox"
                                            checked={!!asistenciaEditor[jugadora.id]?.tarjetaAmarilla}
                                            onChange={() => toggleTarjeta(jugadora.id, 'amarilla')}
                                          />
                                          <span>🟨</span>
                                        </label>
                                        <label className="card-toggle red" title="Tarjeta roja">
                                          <input
                                            type="checkbox"
                                            checked={!!asistenciaEditor[jugadora.id]?.tarjetaRoja}
                                            onChange={() => toggleTarjeta(jugadora.id, 'roja')}
                                          />
                                          <span>🟥</span>
                                        </label>
                                      </div>
                                    </li>
                                  ))}
                                  {!listas.local.length && (
                                    <li className="asistencia-empty">
                                      Sin jugadoras registradas
                                    </li>
                                  )}
                                </ul>
                              </div>

                              <div className="asistencia-col">
                                <div className="asistencia-head">
                                  {partido.equipoVisita.nombre} (
                                  {
                                    listas.visita.filter(
                                      (j) => asistenciaEditor[j.id]?.presente,
                                    ).length
                                  }
                                  /{listas.visita.length})
                                </div>
                                <div className="asistencia-columns">
                                  <span>Asistencia</span>
                                  <span title="Tarjeta amarilla">🟨</span>
                                  <span title="Tarjeta roja">🟥</span>
                                </div>
                                <ul className="asistencia-list">
                                  {listas.visita.map((jugadora) => (
                                    <li
                                      key={jugadora.id}
                                      className="asistencia-item"
                                    >
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={
                                            !!asistenciaEditor[jugadora.id]?.presente
                                          }
                                          onChange={() =>
                                            toggleAsistencia(jugadora.id)
                                          }
                                        />
                                        <span className="checkmark" />
                                        <span className="asistencia-texto">
                                          {jugadora.nombre}
                                          {jugadora.dorsal
                                            ? ` #${jugadora.dorsal}`
                                            : ''}
                                        </span>
                                      </label>
                                      <div className="asistencia-cards">
                                        <label className="card-toggle yellow" title="Tarjeta amarilla">
                                          <input
                                            type="checkbox"
                                            checked={!!asistenciaEditor[jugadora.id]?.tarjetaAmarilla}
                                            onChange={() => toggleTarjeta(jugadora.id, 'amarilla')}
                                          />
                                          <span>🟨</span>
                                        </label>
                                        <label className="card-toggle red" title="Tarjeta roja">
                                          <input
                                            type="checkbox"
                                            checked={!!asistenciaEditor[jugadora.id]?.tarjetaRoja}
                                            onChange={() => toggleTarjeta(jugadora.id, 'roja')}
                                          />
                                          <span>🟥</span>
                                        </label>
                                      </div>
                                    </li>
                                  ))}
                                  {!listas.visita.length && (
                                    <li className="asistencia-empty">
                                      Sin jugadoras registradas
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div className="goal-row">
                        <select
                          value={equipoGol}
                          onChange={(e) => setEquipoGol(e.target.value)}
                        >
                          <option value="local">
                            Gol {partido.equipoLocal.nombre}
                          </option>
                          <option value="visita">
                            Gol {partido.equipoVisita.nombre}
                          </option>
                        </select>
                        <select
                          value={jugadoraGolId}
                          onChange={(e) => setJugadoraGolId(e.target.value)}
                        >
                          <option value="">Selecciona jugadora presente</option>
                          {jugadorasParaEquipo(partido).map((jugadora) => (
                            <option key={jugadora.id} value={jugadora.id}>
                              {jugadora.nombre}
                              {jugadora.dorsal ? ` #${jugadora.dorsal}` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={agregarGol}
                        >
                          + Gol
                        </button>
                      </div>

                      <ul className="goles-lista">
                        {golesEditor.map((g, idx) => {
                          const player = jugadorasPorId.get(
                            Number(g.jugadoraId),
                          );
                          return (
                            <li key={`${g.jugadoraId}-${idx}`}>
                              <span>
                                {player?.nombre ||
                                  g.nombre ||
                                  `ID ${g.jugadoraId}`}
                              </span>
                              <button
                                type="button"
                                className="btn-danger btn-danger-sm"
                                onClick={() => quitarGol(idx)}
                              >
                                Quitar
                              </button>
                            </li>
                          );
                        })}
                        {!golesEditor.length && <li>Sin goles capturados.</li>}
                      </ul>

                      <div className="editor-actions">
                        <button
                          className="btn-primary"
                          onClick={() => guardarResultado(partido.id)}
                        >
                          Guardar Resultado
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={cerrarEditor}
                        >
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
          <div className="no-data">
            No hay partidos para la jornada seleccionada.
          </div>
        )}
      </div>

      {partidoAEliminar && (
        <div
          className="partido-delete-overlay"
          onClick={() => setPartidoAEliminar(null)}
        >
          <div
            className="partido-delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Eliminar partido</h3>
            <p>
              Vas a eliminar el partido{' '}
              <strong>
                {partidoAEliminar.equipoLocal.nombre} vs{' '}
                {partidoAEliminar.equipoVisita.nombre}
              </strong>
              .
            </p>
            <p className="partido-delete-note">
              Esta accion impacta la tabla de posiciones y estadisticas de goleo.
            </p>
            <div className="partido-delete-actions">
              <button
                type="button"
                className="btn-danger"
                onClick={confirmarEliminarPartido}
              >
                Si, eliminar
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPartidoAEliminar(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partidos;
