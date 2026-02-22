import React, { useEffect, useState } from 'react';
import { useLiga } from '../contexts/LigaContext';
import { estadisticasAPI } from '../services/api';
import LigaSelector from '../components/LigaSelector';
import './TablaPosiciones.css';

const TablaPosiciones = () => {
  const { ligaActual, temporadaActual } = useLiga();
  const [tabla, setTabla] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarTabla = async () => {
      if (!temporadaActual?.id) {
        setTabla([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await estadisticasAPI.tabla(temporadaActual.id);
        setTabla(response.data);
      } catch (_error) {
        setError('No fue posible cargar la tabla');
      } finally {
        setLoading(false);
      }
    };
    cargarTabla();
  }, [temporadaActual?.id]);

  return (
    <div className="tabla-container">
      <LigaSelector />
      <h2>
        Tabla de Posiciones: {ligaActual?.nombre} {temporadaActual ? `- ${temporadaActual.nombre}` : ''}
      </h2>

      {loading && <div className="loading-spinner">Cargando tabla...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !tabla.length && (
        <div className="no-data">No hay datos para la temporada seleccionada.</div>
      )}

      {!!tabla.length && (
        <div className="tabla-wrapper">
          <table className="tabla-posiciones">
            <thead>
              <tr>
                <th>#</th>
                <th>Equipo</th>
                <th>PJ</th>
                <th>PG</th>
                <th>PE</th>
                <th>PP</th>
                <th>GF</th>
                <th>GC</th>
                <th>DG</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((row) => (
                <tr key={row.equipoId}>
                  <td>{row.posicion}</td>
                  <td>{row.equipo}</td>
                  <td>{row.pj}</td>
                  <td>{row.pg}</td>
                  <td>{row.pe}</td>
                  <td>{row.pp}</td>
                  <td>{row.gf}</td>
                  <td>{row.gc}</td>
                  <td>{row.dg}</td>
                  <td>{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TablaPosiciones;
