import React, { useMemo, useState } from 'react';
import { useAccess } from '../contexts/AccessContext';
import { useLiga } from '../contexts/LigaContext';
import { extractApiErrorMessage, ligasAPI, temporadasAPI } from '../services/api';
import './Temporadas.css';

const Temporadas = () => {
  const { isAdmin } = useAccess();
  const {
    ligas,
    ligaActual,
    temporadas,
    temporadaActual,
    seleccionarLiga,
    seleccionarTemporada,
    cargarLigas,
    cargarTemporadas,
  } = useLiga();

  const [nombreTemporada, setNombreTemporada] = useState('');
  const [anioTemporada, setAnioTemporada] = useState(String(new Date().getFullYear()));
  const [ligaNombre, setLigaNombre] = useState('');
  const [ligaTipo, setLigaTipo] = useState('VARONIL');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [expandedLigaId, setExpandedLigaId] = useState(null);

  const temporadasOrdenadas = useMemo(
    () =>
      [...temporadas].sort((a, b) => {
        if (a.activa !== b.activa) return a.activa ? -1 : 1;
        if (a.anio !== b.anio) return b.anio - a.anio;
        return a.nombre.localeCompare(b.nombre, 'es');
      }),
    [temporadas],
  );

  const verTemporadas = async (ligaId) => {
    await seleccionarLiga(ligaId);
    setExpandedLigaId(ligaId);
  };

  const crearLiga = async (e) => {
    e.preventDefault();
    if (!ligaNombre.trim()) return;
    setError('');
    setOk('');
    try {
      const response = await ligasAPI.create({
        nombre: ligaNombre.trim(),
        tipo: ligaTipo,
      });
      await cargarLigas();
      await verTemporadas(response.data.id);
      setLigaNombre('');
      setLigaTipo('VARONIL');
      setOk('Liga creada correctamente.');
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  };

  const eliminarLiga = async (ligaId, nombre) => {
    const confirmada = window.confirm(
      `Se eliminara la liga "${nombre}" y sus temporadas relacionadas. Continuar?`,
    );
    if (!confirmada) return;

    setError('');
    setOk('');
    setBusyId(`liga-${ligaId}`);
    try {
      await ligasAPI.remove(ligaId);
      await cargarLigas();
      if (expandedLigaId === ligaId) setExpandedLigaId(null);
      setOk('Liga eliminada.');
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const crearTemporada = async (e) => {
    e.preventDefault();
    if (!ligaActual?.id || !nombreTemporada.trim() || !anioTemporada) return;

    setError('');
    setOk('');
    try {
      const response = await temporadasAPI.create({
        ligaId: ligaActual.id,
        nombre: nombreTemporada.trim(),
        anio: Number(anioTemporada),
        activa: temporadas.length === 0,
      });
      await cargarTemporadas(ligaActual.id);
      seleccionarTemporada(response.data.id);
      setNombreTemporada('');
      setAnioTemporada(String(new Date().getFullYear()));
      setOk('Temporada creada correctamente.');
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  };

  const eliminarTemporada = async (id, nombre) => {
    const confirmada = window.confirm(`Eliminar temporada "${nombre}"?`);
    if (!confirmada || !ligaActual?.id) return;

    setError('');
    setOk('');
    setBusyId(`temp-${id}`);
    try {
      await temporadasAPI.remove(id);
      await cargarTemporadas(ligaActual.id);
      setOk('Temporada eliminada.');
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="temporadas-container">
      <h2>Ligas y Temporadas</h2>

      {error && <div className="error-message">{error}</div>}
      {ok && <div className="success-message">{ok}</div>}

      <section className="temporadas-panel">
        <h3>Ligas</h3>
        {!ligas.length && (
          <div className="no-data">
            No hay ligas registradas.
            {isAdmin ? ' Crea la primera liga para continuar.' : ''}
          </div>
        )}

        {!!ligas.length && (
          <div className="ligas-lista">
            {ligas.map((liga) => {
              const expanded = expandedLigaId === liga.id;
              const isCurrent = ligaActual?.id === liga.id;
              return (
                <article key={liga.id} className={`liga-card ${isCurrent ? 'seleccionada' : ''}`}>
                  <div>
                    <h4>{liga.nombre}</h4>
                    <p>{liga.tipo}</p>
                  </div>
                  <div className="liga-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => verTemporadas(liga.id)}
                    >
                      Ver temporadas
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-delete-temporada"
                        disabled={busyId === `liga-${liga.id}`}
                        onClick={() => eliminarLiga(liga.id, liga.nombre)}
                      >
                        Borrar liga
                      </button>
                    )}
                  </div>

                  {expanded && (
                    <div className="liga-temporadas-expand">
                      <h4>Temporadas</h4>
                      {!temporadasOrdenadas.length && (
                        <div className="no-data">
                          Esta liga aun no tiene temporadas.
                          {isAdmin ? ' Crea la primera temporada aqui.' : ''}
                        </div>
                      )}

                      {!!temporadasOrdenadas.length && (
                        <div className="temporadas-lista">
                          {temporadasOrdenadas.map((temp) => (
                            <article
                              key={temp.id}
                              className={`temporada-card ${
                                temporadaActual?.id === temp.id ? 'seleccionada' : ''
                              }`}
                            >
                              <div>
                                <h4>{temp.nombre}</h4>
                                <p>{temp.anio}</p>
                              </div>
                              <div className="temporada-actions">
                                <span className={`estado ${temp.activa ? 'activa' : 'inactiva'}`}>
                                  {temp.activa ? 'Activa' : 'Inactiva'}
                                </span>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => seleccionarTemporada(temp.id)}
                                >
                                  Seleccionar
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    className="btn-delete-temporada"
                                    disabled={busyId === `temp-${temp.id}`}
                                    onClick={() => eliminarTemporada(temp.id, temp.nombre)}
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      )}

                      {isAdmin && isCurrent && (
                        <div className="modal-content temporada-form-wrap">
                          <h3>Nueva Temporada</h3>
                          <form onSubmit={crearTemporada} className="temporada-form">
                            <div className="form-group">
                              <label>Nombre</label>
                              <input
                                value={nombreTemporada}
                                onChange={(e) => setNombreTemporada(e.target.value)}
                                placeholder="Ej: Clausura"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Anio</label>
                              <input
                                type="number"
                                min="2000"
                                max="2100"
                                value={anioTemporada}
                                onChange={(e) => setAnioTemporada(e.target.value)}
                                required
                              />
                            </div>
                            <button type="submit" className="btn-primary">
                              Crear Temporada
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {isAdmin && (
          <div className="modal-content temporada-form-wrap">
            <h3>Nueva Liga</h3>
            <form onSubmit={crearLiga} className="temporada-form">
              <div className="form-group">
                <label>Nombre</label>
                <input
                  value={ligaNombre}
                  onChange={(e) => setLigaNombre(e.target.value)}
                  placeholder="Ej: Liga Femenil Guadalajara"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={ligaTipo} onChange={(e) => setLigaTipo(e.target.value)}>
                  <option value="VARONIL">Varonil</option>
                  <option value="FEMENIL">Femenil</option>
                  <option value="INFANTIL">Infantil</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">
                Crear Liga
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
};

export default Temporadas;
