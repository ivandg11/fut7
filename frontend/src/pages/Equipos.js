import React, { useState, useEffect } from 'react';
import { useAccess } from '../contexts/AccessContext';
import { useLiga } from '../contexts/LigaContext';
import { equiposAPI } from '../services/api';
import LigaSelector from '../components/LigaSelector';
import './Equipos.css';

const Equipos = () => {
  const { rol } = useAccess();
  const { ligaActual, loading: ligaLoading } = useLiga();
  const [equipos, setEquipos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipoToDelete, setEquipoToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Efecto para cargar equipos cuando cambia la liga actual
  useEffect(() => {
    if (ligaActual) {
      console.log('Liga actual cambiada a:', ligaActual);
      cargarEquipos();
    }
  }, [ligaActual]);

  const cargarEquipos = async () => {
    if (!ligaActual) {
      console.log('No hay liga seleccionada');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log(
        `Cargando equipos para liga: ${ligaActual.dia} (ID: ${ligaActual.id})`,
      );
      const response = await equiposAPI.getByLiga(ligaActual.dia);
      console.log('Equipos recibidos:', response.data);
      setEquipos(response.data);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError(
        'Error al cargar los equipos: ' +
          (error.response?.data?.message || error.message),
      );
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

    if (!ligaActual) {
      setError('No hay una liga seleccionada');
      return;
    }

    try {
      const equipoData = {
        nombre: formData.nombre.trim(),
        ligaId: ligaActual.id,
      };

      console.log('Enviando datos:', equipoData);

      if (editingId) {
        await equiposAPI.update(editingId, {
          nombre: equipoData.nombre,
        });
        setSuccessMessage('Equipo actualizado exitosamente');
      } else {
        await equiposAPI.create(equipoData);
        setSuccessMessage('Equipo creado exitosamente');
      }

      cargarEquipos();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar equipo:', error);
      setError(error.response?.data?.message || 'Error al guardar el equipo');
    }
  };

  const handleDelete = async () => {
    if (!equipoToDelete) return;

    try {
      await equiposAPI.delete(equipoToDelete.id);
      setSuccessMessage('Equipo eliminado exitosamente');
      cargarEquipos();
      setShowDeleteModal(false);
      setEquipoToDelete(null);
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      alert(
        'Error al eliminar el equipo: ' +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const confirmDelete = (equipo) => {
    setEquipoToDelete(equipo);
    setShowDeleteModal(true);
  };

  const handleEdit = (equipo) => {
    setFormData({
      nombre: equipo.nombre,
    });
    setEditingId(equipo.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ nombre: '' });
    setEditingId(null);
    setError('');
  };

  const equiposFiltrados = equipos.filter((equipo) =>
    equipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const puedeCrear = () => rol === 'admin';
  const puedeEditar = () => rol === 'admin';
  const puedeEliminar = () => rol === 'admin';

  if (ligaLoading) {
    return <div className="loading-spinner">Cargando ligas...</div>;
  }

  if (!ligaActual) {
    return (
      <div className="equipos-container">
        <LigaSelector />
        <div className="no-data">Selecciona una liga para ver sus equipos</div>
      </div>
    );
  }

  return (
    <div className="equipos-container">
      <LigaSelector />

      <div className="header">
        <div className="header-title">
          <h2>⚽ {ligaActual.nombre}</h2>
          <p className="total-equipos">{equipos.length} equipos registrados</p>
        </div>
        {puedeCrear() && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Nuevo Equipo
          </button>
        )}
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Buscar equipo por nombre..."
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
            <p>
              No hay equipos registrados en esta liga.{' '}
              {puedeCrear() && '¡Crea el primer equipo!'}
            </p>
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
                  <span className="stat-label">PJ</span>
                  <span className="stat-value">{equipo.partidosJugados}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">GF</span>
                  <span className="stat-value">{equipo.golesFavor}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">GC</span>
                  <span className="stat-value">{equipo.golesContra}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">DG</span>
                  <span className="stat-value">
                    {equipo.golesFavor - equipo.golesContra}
                  </span>
                </div>
                <div className="stat-item puntos">
                  <span className="stat-label">PTS</span>
                  <span className="stat-value">{equipo.puntos}</span>
                </div>
              </div>

              {puedeEditar() && (
                <div className="equipo-acciones">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(equipo)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => confirmDelete(equipo)}
                  >
                     Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear/editar equipo */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {editingId ? ' Editar Equipo' : ' Nuevo Equipo'} -{' '}
              {ligaActual.nombre}
            </h3>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre del Equipo:</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Ej: Real Madrid, Barcelona FC, etc."
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? 'Actualizar Equipo' : 'Guardar Equipo'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && equipoToDelete && (
        <div className="modal-overlay">
          <div className="modal-content modal-delete">
            <h3>⚠️ Eliminar Equipo</h3>
            <p className="delete-warning">
              ¿Estás seguro que deseas eliminar a{' '}
              <strong>"{equipoToDelete.nombre}"</strong> de la{' '}
              {ligaActual.nombre}?
            </p>
            <p className="delete-consequences">
              Esta acción eliminará permanentemente el equipo y no se puede
              deshacer.
              {equipoToDelete.partidosJugados > 0 && (
                <span className="warning-text">
                  <br />
                  ⚠️ Este equipo tiene {equipoToDelete.partidosJugados} partidos
                  jugados. Se eliminarán también todos sus partidos.
                </span>
              )}
            </p>

            <div className="modal-actions">
              <button className="btn-delete-confirm" onClick={handleDelete}>
                Sí, eliminar equipo
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
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

export default Equipos;
