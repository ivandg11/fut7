import React, { useEffect, useState } from 'react';
import LigaSelector from '../components/LigaSelector';
import { useLiga } from '../contexts/LigaContext';
import { partidosAPI } from '../services/api';
import './Partidos.css';

const Partidos = () => {
  const { temporadaActual, ligaActual } = useLiga();
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      if (!temporadaActual?.id) {
        setPartidos([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await partidosAPI.getByTemporada(temporadaActual.id);
        setPartidos(response.data);
      } catch (_error) {
        setError('No fue posible cargar partidos');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [temporadaActual?.id]);

  const formatFecha = (iso) =>
    new Date(iso).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <div className="partidos-container">
      <LigaSelector />
      <h2>
        Partidos: {ligaActual?.nombre} {temporadaActual ? `- ${temporadaActual.nombre}` : ''}
      </h2>

      {loading && <div className="loading-spinner">Cargando partidos...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !partidos.length && (
        <div className="no-data">No hay partidos para esta temporada.</div>
      )}

      <div className="partidos-grid">
        {partidos.map((partido) => (
          <div key={partido.id} className={`partido-card ${partido.status === 'JUGADO' ? 'jugado' : ''}`}>
            <div className="partido-header">
              <span>Jornada {partido.jornada}</span>
              <span>{formatFecha(partido.fecha)}</span>
            </div>
            <div className="partido-info">
              <strong>{partido.equipoLocal.nombre}</strong>
              <span>
                {partido.golesLocal} - {partido.golesVisita}
              </span>
              <strong>{partido.equipoVisita.nombre}</strong>
            </div>
            <div className="partido-footer">
              <span>{partido.status}</span>
              <span>{partido.cancha || 'Sin cancha'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Partidos;
