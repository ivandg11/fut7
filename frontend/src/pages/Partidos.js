import React, { useState, useEffect } from 'react';
import { useAccess } from '../contexts/AccessContext';
import { useLiga } from '../contexts/LigaContext';
import { partidosAPI, equiposAPI } from '../services/api';
import LigaSelector from '../components/LigaSelector';
import './Partidos.css';

const normalizarDia = (dia = '') =>
  dia
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const getHorarioConfig = (dia) => {
  const esSabado = normalizarDia(dia) === 'SABADO';

  if (esSabado) {
    return {
      min: '08:00',
      max: '13:20',
      descripcion: 'Sabado: 08:00 a 13:20'
    };
  }

  return {
    min: '19:00',
    max: '23:10',
    descripcion: 'Lunes a viernes: 19:00 a 23:10'
  };
};

const horaAMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

const horarioEnRango = (horario, min, max) => {
  const total = horaAMinutos(horario);
  return total >= horaAMinutos(min) && total <= horaAMinutos(max);
};

const Partidos = () => {
  const { rol } = useAccess();
  const { ligaActual, jornadaActual, setJornadaActual, loading: ligaLoading } = useLiga();
  const horarioConfig = getHorarioConfig(ligaActual?.dia);
  const [partidos, setPartidos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showResultadoModal, setShowResultadoModal] = useState(false);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    equipoLocalId: '',
    equipoVisitaId: '',
    fecha: new Date().toISOString().split('T')[0],
    cancha: 1,
    horario: '19:00',
    jornada: 1
  });

  const [resultadoData, setResultadoData] = useState({
    golesLocal: '0',
    golesVisita: '0'
  });

  useEffect(() => {
    if (ligaActual) {
      console.log('Liga actual cambiada a:', ligaActual);
      const horarioInicial = getHorarioConfig(ligaActual.dia).min;
      setFormData(prev => ({ ...prev, horario: horarioInicial }));
      cargarEquipos();
      cargarJornadas();
    }
  }, [ligaActual]);

  useEffect(() => {
    if (ligaActual) {
      cargarPartidos();
    }
  }, [ligaActual, jornadaActual]);

  const cargarEquipos = async () => {
    try {
      console.log('Cargando equipos para liga:', ligaActual.dia);
      const response = await equiposAPI.getByLiga(ligaActual.dia);
      console.log('Equipos cargados:', response.data);
      setEquipos(response.data);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError('Error al cargar equipos');
    }
  };

  const cargarJornadas = async () => {
    try {
      console.log('Cargando jornadas para liga ID:', ligaActual.id);
      const response = await partidosAPI.getJornadas(ligaActual.id);
      console.log('Jornadas cargadas:', response.data);
      setJornadas(response.data);
      if (response.data.length > 0) {
        const maxJornada = Math.max(...response.data);
        setJornadaActual(maxJornada);
        setFormData(prev => ({ ...prev, jornada: maxJornada }));
      }
    } catch (error) {
      console.error('Error al cargar jornadas:', error);
    }
  };

  const cargarPartidos = async () => {
    setLoading(true);
    setError('');
    try {
      console.log(`Cargando partidos para liga: ${ligaActual.dia}, jornada: ${jornadaActual}`);
      const response = await partidosAPI.getByLiga(ligaActual.dia, jornadaActual);
      console.log('Partidos cargados:', response.data);
      setPartidos(response.data.partidos || []);
    } catch (error) {
      console.error('Error al cargar partidos:', error);
      setError('Error al cargar partidos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const horario = (formData.horario || '').trim();
    const formatoHoraValido = /^\d{2}:\d{2}$/.test(horario);

    if (!formatoHoraValido) {
      setError('El horario debe tener formato HH:MM (24 horas)');
      return;
    }

    if (!horarioEnRango(horario, horarioConfig.min, horarioConfig.max)) {
      setError(`Horario fuera de rango. Permitido: ${horarioConfig.descripcion}`);
      return;
    }
    
    try {
      const partidoData = {
        ...formData,
        horario,
        ligaId: ligaActual.id
      };
      console.log('Creando partido:', partidoData);
      
      await partidosAPI.create(partidoData);
      setSuccessMessage('Partido creado exitosamente');
      cargarPartidos();
      cargarJornadas();
      handleCloseModal();
    } catch (error) {
      console.error('Error al crear partido:', error);
      setError(error.response?.data?.message || 'Error al crear partido');
    }
  };

  const handleRegistrarResultado = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const golesLocal = resultadoData.golesLocal.trim();
    const golesVisita = resultadoData.golesVisita.trim();
    const esEnteroNoNegativo = (valor) => /^\d+$/.test(valor);

    if (!golesLocal || !golesVisita) {
      setError('Debes capturar ambos marcadores');
      return;
    }

    if (!esEnteroNoNegativo(golesLocal) || !esEnteroNoNegativo(golesVisita)) {
      setError('El marcador solo acepta numeros enteros (sin letras ni simbolos)');
      return;
    }
    
    try {
      const payload = {
        golesLocal: parseInt(golesLocal, 10),
        golesVisita: parseInt(golesVisita, 10)
      };

      console.log('Registrando resultado:', payload);
      await partidosAPI.registrarResultado(partidoSeleccionado.id, payload);
      setSuccessMessage('Resultado registrado exitosamente');
      cargarPartidos();
      setShowResultadoModal(false);
      setPartidoSeleccionado(null);
    } catch (error) {
      console.error('Error al registrar resultado:', error);
      setError(error.response?.data?.message || 'Error al registrar resultado');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      equipoLocalId: '',
      equipoVisitaId: '',
      fecha: new Date().toISOString().split('T')[0],
      cancha: 1,
      horario: horarioConfig.min,
      jornada: jornadaActual
    });
    setError('');
  };

  const puedeEditar = () => rol === 'admin' || rol === 'editor';
  const puedeCrear = () => rol === 'admin' || rol === 'editor';

  const partidosPorCancha = (cancha) => {
    return partidos.filter(p => p.cancha === cancha);
  };

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit'
    });
  };

  if (ligaLoading) {
    return <div className="loading-spinner">Cargando ligas...</div>;
  }

  if (!ligaActual) {
    return (
      <div className="partidos-container">
        <LigaSelector />
        <div className="no-data">Selecciona una liga para ver sus partidos</div>
      </div>
    );
  }

  return (
    <div className="partidos-container">
      <LigaSelector />
      
      <div className="header">
        <div>
          <h2>⚽ {ligaActual.nombre}</h2>
          <p className="liga-dia-subtitle">{ligaActual.dia}</p>
        </div>
        
        <div className="jornada-selector">
          <label>Jornada:</label>
          <select 
            value={jornadaActual} 
            onChange={(e) => setJornadaActual(parseInt(e.target.value))}
            className="jornada-select"
          >
            {jornadas.length > 0 ? (
              jornadas.map(j => (
                <option key={j} value={j}>Jornada {j}</option>
              ))
            ) : (
              <option value={1}>Jornada 1</option>
            )}
          </select>
        </div>

        {puedeCrear() && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Programar Partido
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

      {loading ? (
        <div className="loading-spinner">Cargando partidos...</div>
      ) : (
        <div className="canchas-container">
          {/* Cancha 1 */}
          <div className="cancha-section">
            <h3 className="cancha-titulo">🏟️ Cancha 1</h3>
            <div className="partidos-grid">
              {partidosPorCancha(1).length === 0 ? (
                <p className="no-partidos">No hay partidos programados</p>
              ) : (
                partidosPorCancha(1).map(partido => (
                  <div key={partido.id} className={`partido-card ${partido.jugado ? 'jugado' : ''}`}>
                    <div className="partido-header">
                      <span className="horario">{partido.horario}</span>
                      <span className="fecha">{formatFecha(partido.fecha)}</span>
                    </div>
                    
                    <div className="partido-info">
                      <div className="equipo-local">
                        <span className="equipo-nombre">{partido.equipoLocal.nombre}</span>
                        <span className="goles">{partido.golesLocal}</span>
                      </div>
                      <span className="vs">VS</span>
                      <div className="equipo-visita">
                        <span className="goles">{partido.golesVisita}</span>
                        <span className="equipo-nombre">{partido.equipoVisita.nombre}</span>
                      </div>
                    </div>

                    <div className="partido-footer">
                      {!partido.jugado ? (
                        puedeEditar() && (
                          <button 
                            className="btn-resultado"
                            onClick={() => {
                              setPartidoSeleccionado(partido);
                              setResultadoData({
                                golesLocal: String(partido.golesLocal),
                                golesVisita: String(partido.golesVisita)
                              });
                              setShowResultadoModal(true);
                            }}
                          >
                            📝 Registrar Resultado
                          </button>
                        )
                      ) : (
                        <span className="jugado-badge">✅ Finalizado</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cancha 2 */}
          <div className="cancha-section">
            <h3 className="cancha-titulo">🏟️ Cancha 2</h3>
            <div className="partidos-grid">
              {partidosPorCancha(2).length === 0 ? (
                <p className="no-partidos">No hay partidos programados</p>
              ) : (
                partidosPorCancha(2).map(partido => (
                  <div key={partido.id} className={`partido-card ${partido.jugado ? 'jugado' : ''}`}>
                    <div className="partido-header">
                      <span className="horario">{partido.horario}</span>
                      <span className="fecha">{formatFecha(partido.fecha)}</span>
                    </div>
                    
                    <div className="partido-info">
                      <div className="equipo-local">
                        <span className="equipo-nombre">{partido.equipoLocal.nombre}</span>
                        <span className="goles">{partido.golesLocal}</span>
                      </div>
                      <span className="vs">VS</span>
                      <div className="equipo-visita">
                        <span className="goles">{partido.golesVisita}</span>
                        <span className="equipo-nombre">{partido.equipoVisita.nombre}</span>
                      </div>
                    </div>

                    <div className="partido-footer">
                      {!partido.jugado ? (
                        puedeEditar() && (
                          <button 
                            className="btn-resultado"
                            onClick={() => {
                              setPartidoSeleccionado(partido);
                              setResultadoData({
                                golesLocal: String(partido.golesLocal),
                                golesVisita: String(partido.golesVisita)
                              });
                              setShowResultadoModal(true);
                            }}
                          >
                            📝 Registrar Resultado
                          </button>
                        )
                      ) : (
                        <span className="jugado-badge">✅ Finalizado</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para programar partido */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Programar Partido - {ligaActual.nombre}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Jornada:</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.jornada}
                    onChange={(e) => setFormData({...formData, jornada: parseInt(e.target.value)})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Cancha:</label>
                  <select
                    value={formData.cancha}
                    onChange={(e) => setFormData({...formData, cancha: parseInt(e.target.value)})}
                    required
                  >
                    <option value={1}>Cancha 1</option>
                    <option value={2}>Cancha 2</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha:</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Horario:</label>
                  <input
                    type="time"
                    min={horarioConfig.min}
                    max={horarioConfig.max}
                    value={formData.horario}
                    onChange={(e) => setFormData({...formData, horario: e.target.value})}
                    required
                  />
                  <small className="horario-help">
                    Formato HH:MM (24h). {horarioConfig.descripcion}
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>Equipo Local:</label>
                <select
                  value={formData.equipoLocalId}
                  onChange={(e) => setFormData({...formData, equipoLocalId: parseInt(e.target.value)})}
                  required
                >
                  <option value="">Seleccionar equipo</option>
                  {equipos.map(equipo => (
                    <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Equipo Visitante:</label>
                <select
                  value={formData.equipoVisitaId}
                  onChange={(e) => setFormData({...formData, equipoVisitaId: parseInt(e.target.value)})}
                  required
                >
                  <option value="">Seleccionar equipo</option>
                  {equipos.map(equipo => (
                    <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">Guardar Partido</button>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para registrar resultado */}
      {showResultadoModal && partidoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Registrar Resultado</h3>
            <p className="partido-info-modal">
              {partidoSeleccionado.equipoLocal.nombre} vs {partidoSeleccionado.equipoVisita.nombre}
            </p>
            <form onSubmit={handleRegistrarResultado}>
              <div className="resultado-form">
                <div className="equipo-resultado">
                  <label>{partidoSeleccionado.equipoLocal.nombre}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={resultadoData.golesLocal}
                    onChange={(e) => setResultadoData({
                      ...resultadoData,
                      golesLocal: e.target.value
                    })}
                    required
                  />
                </div>
                <span className="vs-modal">VS</span>
                <div className="equipo-resultado">
                  <label>{partidoSeleccionado.equipoVisita.nombre}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={resultadoData.golesVisita}
                    onChange={(e) => setResultadoData({
                      ...resultadoData,
                      golesVisita: e.target.value
                    })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Guardar Resultado
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowResultadoModal(false);
                    setPartidoSeleccionado(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partidos;
