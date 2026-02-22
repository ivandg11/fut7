import React, { useEffect, useMemo, useState } from 'react';
import LigaSelector from '../components/LigaSelector';
import { useAccess } from '../contexts/AccessContext';
import { useLiga } from '../contexts/LigaContext';
import { equiposAPI, jugadorasAPI, partidosAPI } from '../services/api';

const AdminPanel = () => {
  const { role, isAdmin, login, error: authError, setError: setAuthError } = useAccess();
  const { temporadaActual } = useLiga();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [jugadoras, setJugadoras] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [jugadoraForm, setJugadoraForm] = useState({
    equipoId: '',
    nombre: '',
    dorsal: '',
    posicion: '',
  });
  const [partidoForm, setPartidoForm] = useState({
    equipoLocalId: '',
    equipoVisitaId: '',
    jornada: '1',
    fecha: '',
    cancha: '',
  });
  const [resultadoForm, setResultadoForm] = useState({
    partidoId: '',
    golesTexto: '',
  });

  const cargarData = async () => {
    if (!temporadaActual?.id || !isAdmin) return;
    try {
      const [eq, ju, pa] = await Promise.all([
        equiposAPI.getByTemporada(temporadaActual.id),
        jugadorasAPI.getAll({ temporadaId: temporadaActual.id }),
        partidosAPI.getByTemporada(temporadaActual.id),
      ]);
      setEquipos(eq.data);
      setJugadoras(ju.data);
      setPartidos(pa.data);
    } catch (_error) {
      setError('No fue posible cargar datos de administracion');
    }
  };

  useEffect(() => {
    cargarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temporadaActual?.id, isAdmin]);

  const jugadorasPorEquipo = useMemo(() => {
    const map = new Map();
    for (const jugadora of jugadoras) {
      if (!map.has(jugadora.equipoId)) map.set(jugadora.equipoId, []);
      map.get(jugadora.equipoId).push(jugadora);
    }
    return map;
  }, [jugadoras]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const okLogin = await login(email, password);
    if (!okLogin) return;
    setEmail('');
    setPassword('');
  };

  const crearEquipo = async (e) => {
    e.preventDefault();
    if (!temporadaActual?.id || !nuevoEquipo.trim()) return;
    try {
      await equiposAPI.create({
        temporadaId: temporadaActual.id,
        nombre: nuevoEquipo.trim(),
      });
      setNuevoEquipo('');
      setOk('Equipo creado');
      await cargarData();
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible crear equipo');
    }
  };

  const crearJugadora = async (e) => {
    e.preventDefault();
    if (!jugadoraForm.equipoId || !jugadoraForm.nombre.trim()) return;
    try {
      await jugadorasAPI.create({
        equipoId: Number(jugadoraForm.equipoId),
        nombre: jugadoraForm.nombre.trim(),
        dorsal: jugadoraForm.dorsal ? Number(jugadoraForm.dorsal) : null,
        posicion: jugadoraForm.posicion.trim() || null,
      });
      setJugadoraForm({ equipoId: '', nombre: '', dorsal: '', posicion: '' });
      setOk('Jugadora creada');
      await cargarData();
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible crear jugadora');
    }
  };

  const crearPartido = async (e) => {
    e.preventDefault();
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
      setOk('Partido creado');
      await cargarData();
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible crear partido');
    }
  };

  const registrarResultado = async (e) => {
    e.preventDefault();
    try {
      const goles = resultadoForm.golesTexto
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const [jugadoraId, minuto] = item.split(':').map((v) => v.trim());
          return {
            jugadoraId: Number(jugadoraId),
            minuto: minuto ? Number(minuto) : null,
          };
        });

      await partidosAPI.registrarResultado(Number(resultadoForm.partidoId), { goles });
      setResultadoForm({ partidoId: '', golesTexto: '' });
      setOk('Resultado registrado');
      await cargarData();
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible registrar resultado');
    }
  };

  if (!isAdmin) {
    return (
      <div className="equipos-container">
        <h2>Panel de Administracion (JWT)</h2>
        <p>Rol actual: {role}</p>
        <form onSubmit={handleLogin} className="modal-content" style={{ maxWidth: 420 }}>
          <div className="form-group">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            Iniciar sesion
          </button>
          {authError && <p className="error-message">{authError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="equipos-container">
      <h2>Panel de Administracion</h2>
      <LigaSelector />
      {!temporadaActual && (
        <div className="error-message">Selecciona o crea una temporada para administrar.</div>
      )}
      {error && <div className="error-message">{error}</div>}
      {ok && (
        <div className="success-message">
          {ok} <button onClick={() => setOk('')}>x</button>
        </div>
      )}

      {temporadaActual && (
        <>
          <div className="modal-content" style={{ marginBottom: 16 }}>
            <h3>CRUD Equipos</h3>
            <form onSubmit={crearEquipo} className="form-group">
              <input
                placeholder="Nombre del equipo"
                value={nuevoEquipo}
                onChange={(e) => setNuevoEquipo(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">
                Crear Equipo
              </button>
            </form>
            <ul>
              {equipos.map((equipo) => (
                <li key={equipo.id}>{equipo.nombre}</li>
              ))}
            </ul>
          </div>

          <div className="modal-content" style={{ marginBottom: 16 }}>
            <h3>CRUD Jugadoras</h3>
            <form onSubmit={crearJugadora}>
              <div className="form-group">
                <label>Equipo</label>
                <select
                  value={jugadoraForm.equipoId}
                  onChange={(e) =>
                    setJugadoraForm({ ...jugadoraForm, equipoId: e.target.value })
                  }
                  required
                >
                  <option value="">Selecciona equipo</option>
                  {equipos.map((equipo) => (
                    <option value={equipo.id} key={equipo.id}>
                      {equipo.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  value={jugadoraForm.nombre}
                  onChange={(e) =>
                    setJugadoraForm({ ...jugadoraForm, nombre: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Dorsal</label>
                <input
                  value={jugadoraForm.dorsal}
                  onChange={(e) =>
                    setJugadoraForm({ ...jugadoraForm, dorsal: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Posicion</label>
                <input
                  value={jugadoraForm.posicion}
                  onChange={(e) =>
                    setJugadoraForm({ ...jugadoraForm, posicion: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="btn-primary">
                Crear Jugadora
              </button>
            </form>
            <ul>
              {equipos.map((equipo) => (
                <li key={equipo.id}>
                  <strong>{equipo.nombre}:</strong>{' '}
                  {(jugadorasPorEquipo.get(equipo.id) || [])
                    .map((jugadora) => `${jugadora.nombre}${jugadora.dorsal ? ` #${jugadora.dorsal}` : ''}`)
                    .join(', ') || 'Sin jugadoras'}
                </li>
              ))}
            </ul>
          </div>

          <div className="modal-content" style={{ marginBottom: 16 }}>
            <h3>Registro de Partidos</h3>
            <form onSubmit={crearPartido}>
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
                <input
                  value={partidoForm.cancha}
                  onChange={(e) => setPartidoForm({ ...partidoForm, cancha: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Equipo Local</label>
                <select
                  value={partidoForm.equipoLocalId}
                  onChange={(e) =>
                    setPartidoForm({ ...partidoForm, equipoLocalId: e.target.value })
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
                    setPartidoForm({ ...partidoForm, equipoVisitaId: e.target.value })
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
                Crear Partido
              </button>
            </form>
          </div>

          <div className="modal-content">
            <h3>Registrar Resultado y Goles por Jugadora</h3>
            <form onSubmit={registrarResultado}>
              <div className="form-group">
                <label>Partido</label>
                <select
                  value={resultadoForm.partidoId}
                  onChange={(e) =>
                    setResultadoForm({ ...resultadoForm, partidoId: e.target.value })
                  }
                  required
                >
                  <option value="">Selecciona partido</option>
                  {partidos.map((partido) => (
                    <option key={partido.id} value={partido.id}>
                      J{partido.jornada}: {partido.equipoLocal.nombre} vs {partido.equipoVisita.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Goles (formato: jugadoraId:minuto, jugadoraId:minuto)</label>
                <input
                  value={resultadoForm.golesTexto}
                  onChange={(e) =>
                    setResultadoForm({ ...resultadoForm, golesTexto: e.target.value })
                  }
                  placeholder="12:10, 12:40, 19:55"
                />
              </div>
              <button type="submit" className="btn-primary">
                Guardar Resultado
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;
