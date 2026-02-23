import React, { useEffect, useState } from 'react';
import LigaSelector from '../components/LigaSelector';
import { useLiga } from '../contexts/LigaContext';
import { estadisticasAPI, extractApiErrorMessage } from '../services/api';

const Goleo = () => {
  const { ligaActual, temporadaActual } = useLiga();
  const [goleo, setGoleo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      if (!temporadaActual?.id) {
        setGoleo([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await estadisticasAPI.goleo(temporadaActual.id);
        setGoleo(response.data);
      } catch (err) {
        setError(`No fue posible cargar la tabla de goleo: ${extractApiErrorMessage(err)}`);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [temporadaActual?.id]);

  return (
    <div className="tabla-container">
      <LigaSelector />
      <header className="tabla-page-header">
        <h2>
          Tabla de Goleo: {ligaActual?.nombre} {temporadaActual ? `- ${temporadaActual.nombre}` : ''}
        </h2>
        <p>Ranking de jugadoras con impacto ofensivo y productividad por temporada.</p>
      </header>

      {loading && <div className="loading-spinner">Cargando goleo...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !goleo.length && (
        <div className="no-data">Sin goles registrados para esta temporada.</div>
      )}

      {!!goleo.length && (
        <div className="tabla-wrapper">
          <table className="tabla-posiciones">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugadora</th>
                <th>Equipo</th>
                <th>Goles</th>
              </tr>
            </thead>
            <tbody>
              {goleo.map((item, index) => (
                <tr key={item.jugadoraId} className={`${index < 3 ? 'top-4' : ''} ${index === 0 ? 'is-first' : ''}`}>
                  <td className="posicion">
                    <span className="rank-pill">{item.posicion}</span>
                  </td>
                  <td className="equipo-nombre">{item.jugadora}</td>
                  <td>{item.equipo}</td>
                  <td className="puntos">
                    <span className="points-pill">{item.goles}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Goleo;
