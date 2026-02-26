import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccess } from '../contexts/AccessContext';
import { useLiga } from '../contexts/LigaContext';
import { equiposAPI, jugadorasAPI, extractApiErrorMessage } from '../services/api';
import LigaSelector from '../components/LigaSelector';
import './Equipos.css';

const DEFAULT_FILAS_JUGADORAS = 10;
const createJugadoraRow = (overrides = {}) => ({
  id: null,
  nombre: '',
  dorsal: '',
  originalNombre: '',
  originalDorsal: '',
  ...overrides,
});
const buildRowsWithMinimum = (rows, min = DEFAULT_FILAS_JUGADORAS) => {
  const normalized = rows.map((row) => createJugadoraRow(row));
  while (normalized.length < min) normalized.push(createJugadoraRow());
  return normalized;
};

const Equipos = () => {
  const { role } = useAccess();
  const { temporadaActual, loading: ligaLoading } = useLiga();
  const [equipos, setEquipos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipoToDelete, setEquipoToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ nombre: '' });
  const [editingId, setEditingId] = useState(null);
  const [jugadorasDraft, setJugadorasDraft] = useState(
    buildRowsWithMinimum([], DEFAULT_FILAS_JUGADORAS),
  );
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (temporadaActual?.id) {
      cargarEquipos();
    }
  }, [temporadaActual?.id]);

  const cargarEquipos = async () => {
    if (!temporadaActual?.id) return;

    setLoading(true);
    setError('');
    try {
      const response = await equiposAPI.getByTemporada(temporadaActual.id);
      setEquipos(response.data);
    } catch (err) {
      setError(`Error al cargar los equipos: ${extractApiErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.nombre.trim()) {
      setError('El nombre del equipo es obligatorio');
      return;
    }

    if (!temporadaActual?.id) {
      setError('No hay una temporada seleccionada');
      return;
    }

    const jugadorasLimpias = [];
    for (const jugadora of jugadorasDraft) {
      const nombre = jugadora.nombre.trim();
      const dorsalRaw = String(jugadora.dorsal || '').trim();
      if (!nombre && !dorsalRaw) continue;
      if (!nombre) {
        setError('Cada fila con dorsal debe tener nombre de jugadora');
        return;
      }
      if (dorsalRaw && !/^\d+$/.test(dorsalRaw)) {
        setError(`Dorsal invalido para ${nombre}. Usa solo numeros.`);
        return;
      }
      jugadorasLimpias.push({
        id: jugadora.id,
        nombre,
        dorsal: dorsalRaw ? Number(dorsalRaw) : null,
        originalNombre: jugadora.originalNombre,
        originalDorsal: jugadora.originalDorsal,
      });
    }

    try {
      if (editingId) {
        await equiposAPI.update(editingId, { nombre: formData.nombre.trim() });
        const jugadorasNuevas = jugadorasLimpias.filter((jugadora) => !jugadora.id);
        const jugadorasEditadas = jugadorasLimpias.filter((jugadora) => {
          if (!jugadora.id) return false;
          return (
            jugadora.nombre !== jugadora.originalNombre ||
            String(jugadora.dorsal ?? '') !== String(jugadora.originalDorsal ?? '')
          );
        });

        if (jugadorasEditadas.length) {
          await Promise.all(
            jugadorasEditadas.map((jugadora) =>
              jugadorasAPI.update(jugadora.id, {
                nombre: jugadora.nombre,
                dorsal: jugadora.dorsal,
              }),
            ),
          );
        }

        if (jugadorasNuevas.length) {
          await Promise.all(
            jugadorasNuevas.map((jugadora) =>
              jugadorasAPI.create({
                equipoId: editingId,
                nombre: jugadora.nombre,
                dorsal: jugadora.dorsal,
              }),
            ),
          );
        }
        await Promise.all([cargarEquipos(), cargarJugadorasEquipo(editingId)]);
        setSuccessMessage('Equipo actualizado exitosamente');
        handleCloseModal();
      } else {
        const response = await equiposAPI.create({
          nombre: formData.nombre.trim(),
          temporadaId: temporadaActual.id,
        });
        const equipoIdCreado = response.data?.id;
        const jugadorasNuevas = jugadorasLimpias.filter((jugadora) => !jugadora.id);
        if (equipoIdCreado && jugadorasNuevas.length) {
          await Promise.all(
            jugadorasNuevas.map((jugadora) =>
              jugadorasAPI.create({
                equipoId: equipoIdCreado,
                nombre: jugadora.nombre,
                dorsal: jugadora.dorsal,
              }),
            ),
          );
        }
        setSuccessMessage(
          jugadorasNuevas.length
            ? `Equipo creado y ${jugadorasNuevas.length} jugadora(s) agregada(s).`
            : 'Equipo creado exitosamente',
        );
        await cargarEquipos();
        handleCloseModal();
      }
    } catch (err) {
      setError(`Error al guardar el equipo: ${extractApiErrorMessage(err)}`);
    }
  };

  const handleDelete = async () => {
    if (!equipoToDelete) return;

    try {
      await equiposAPI.remove(equipoToDelete.id);
      setSuccessMessage('Equipo eliminado exitosamente');
      await cargarEquipos();
      setShowDeleteModal(false);
      setEquipoToDelete(null);
    } catch (err) {
      alert(`Error al eliminar el equipo: ${extractApiErrorMessage(err)}`);
    }
  };

  const confirmDelete = (equipo) => {
    setEquipoToDelete(equipo);
    setShowDeleteModal(true);
  };

  const handleEdit = (equipo) => {
    setFormData({ nombre: equipo.nombre });
    setEditingId(equipo.id);
    setJugadorasDraft(buildRowsWithMinimum([], DEFAULT_FILAS_JUGADORAS));
    cargarJugadorasEquipo(equipo.id);
    setShowModal(true);
  };

  const handleOpenCreateModal = () => {
    setFormData({ nombre: '' });
    setEditingId(null);
    setJugadorasDraft(buildRowsWithMinimum([], DEFAULT_FILAS_JUGADORAS));
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ nombre: '' });
    setEditingId(null);
    setJugadorasDraft(buildRowsWithMinimum([], DEFAULT_FILAS_JUGADORAS));
    setError('');
  };

  const cargarJugadorasEquipo = async (equipoId) => {
    if (!equipoId) return;
    try {
      const response = await jugadorasAPI.getAll({ equipoId });
      const rows = (response.data || []).map((jugadora) =>
        createJugadoraRow({
          id: jugadora.id,
          nombre: jugadora.nombre || '',
          dorsal:
            jugadora.dorsal === null || jugadora.dorsal === undefined
              ? ''
              : String(jugadora.dorsal),
          originalNombre: jugadora.nombre || '',
          originalDorsal:
            jugadora.dorsal === null || jugadora.dorsal === undefined
              ? ''
              : String(jugadora.dorsal),
        }),
      );
      setJugadorasDraft(buildRowsWithMinimum(rows, DEFAULT_FILAS_JUGADORAS));
    } catch (err) {
      setError(`Error al cargar jugadoras: ${extractApiErrorMessage(err)}`);
      setJugadorasDraft(buildRowsWithMinimum([], DEFAULT_FILAS_JUGADORAS));
    }
  };

  const actualizarJugadoraDraft = (index, field, value) => {
    setJugadorasDraft((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const agregarFilaJugadoraDraft = () => {
    setJugadorasDraft((prev) => [...prev, createJugadoraRow()]);
  };

  const quitarFilaJugadoraDraft = (index) => {
    const fila = jugadorasDraft[index];
    if (!fila) return;

    const removeLocalRow = () => {
      setJugadorasDraft((prev) => {
        const next = prev.filter((_, i) => i !== index);
        return buildRowsWithMinimum(next, DEFAULT_FILAS_JUGADORAS);
      });
    };

    if (!fila.id) {
      removeLocalRow();
      return;
    }

    const eliminar = async () => {
      try {
        await jugadorasAPI.remove(fila.id);
        setSuccessMessage(`Jugadora ${fila.nombre} eliminada.`);
        removeLocalRow();
        await cargarEquipos();
      } catch (err) {
        setError(`Error al eliminar jugadora: ${extractApiErrorMessage(err)}`);
      }
    };
    eliminar();
  };

  const equiposFiltrados = equipos.filter((equipo) =>
    equipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const canManage = role === 'SUPER_ADMIN' || role === 'admin';

  if (ligaLoading) {
    return <div className="loading-spinner">Cargando ligas...</div>;
  }

  if (!canManage) {
    return (
      <div className="equipos-container">
        <div className="error-message">Solo administradores pueden ver esta seccion.</div>
      </div>
    );
  }

  if (!temporadaActual) {
    return (
      <div className="equipos-container">
        <LigaSelector />
        <div className="no-data">
          Selecciona o crea una temporada para poder dar de alta equipos.
          <div style={{ marginTop: 12 }}>
            <Link to="/temporadas" className="btn-primary">
              Ir a Temporadas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="equipos-container">
      <LigaSelector />

      <div className="header">
        <div className="header-title">
          <h2>Equipos</h2>
          <p className="total-equipos">{equipos.length} equipos registrados</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={handleOpenCreateModal}>
            + Nuevo Equipo
          </button>
        )}
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>x</button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>x</button>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar equipo por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading-spinner">Cargando equipos...</div>
      ) : equiposFiltrados.length === 0 ? (
        <div className="no-equipos">
          {searchTerm ? (
            <p>No se encontraron equipos con "{searchTerm}"</p>
          ) : (
            <p>No hay equipos registrados en esta temporada.</p>
          )}
        </div>
      ) : (
        <div className="equipos-grid">
          {equiposFiltrados.map((equipo) => (
            <div key={equipo.id} className="equipo-card">
              <div className="equipo-header">
                <h3 className="equipo-nombre-card">{equipo.nombre}</h3>
              </div>

              <div className="equipo-stats">
                <div className="stat-item">
                  <span className="stat-label">Plantel</span>
                  <span className="stat-value">{equipo._count?.jugadoras || 0}</span>
                </div>
              </div>

              {canManage && (
                <div className="equipo-acciones">
                  <button className="btn-edit" onClick={() => handleEdit(equipo)}>
                    Editar
                  </button>
                  <button className="btn-delete" onClick={() => confirmDelete(equipo)}>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingId ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre del Equipo:</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Real Madrid, Barcelona FC"
                  required
                  autoFocus
                />
              </div>

              <div className="plantel-form-section">
                <div className="plantel-form-header">
                  <h4>Plantel (opcional)</h4>
                  <button type="button" className="btn-secondary" onClick={agregarFilaJugadoraDraft}>
                    + Fila Jugadora
                  </button>
                </div>
                <p className="plantel-help">Agrega nombre y numero. Si lo dejas vacio, se guarda solo el equipo.</p>

                <div className="jugadoras-draft-grid">
                  {jugadorasDraft.map((jugadora, idx) => (
                    <div key={`draft-${idx}`} className="jugadora-draft-row">
                      <input
                        type="text"
                        value={jugadora.nombre}
                        onChange={(e) => actualizarJugadoraDraft(idx, 'nombre', e.target.value)}
                        placeholder="Nombre jugadora"
                      />
                      <input
                        type="text"
                        value={jugadora.dorsal}
                        onChange={(e) => actualizarJugadoraDraft(idx, 'dorsal', e.target.value)}
                        placeholder="Numero"
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        className="btn-delete-inline"
                        onClick={() => quitarFilaJugadoraDraft(idx)}
                        aria-label={`Quitar fila ${idx + 1}`}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? 'Guardar cambios' : 'Guardar equipo'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && equipoToDelete && (
        <div className="modal-overlay">
          <div className="modal-content modal-delete">
            <h3>Eliminar Equipo</h3>
            <p className="delete-warning">
              Estas seguro que deseas eliminar a <strong>"{equipoToDelete.nombre}"</strong>?
            </p>
            <p className="delete-consequences">
              Esta accion eliminara permanentemente el equipo y no se puede deshacer.
            </p>

            <div className="modal-actions">
              <button className="btn-delete-confirm" onClick={handleDelete}>
                Si, eliminar equipo
              </button>
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipos;
