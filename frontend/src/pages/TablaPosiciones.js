import React, { useEffect, useState } from 'react';
import { useLiga } from '../contexts/LigaContext';
import { estadisticasAPI, extractApiErrorMessage } from '../services/api';
import LigaSelector from '../components/LigaSelector';
import './TablaPosiciones.css';

const TablaPosiciones = () => {
  const { ligaActual, temporadaActual } = useLiga();
  const [tabla, setTabla] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mejorDefensa = tabla.length
    ? tabla.reduce((best, team) => (team.gc < best.gc ? team : best), tabla[0])
    : null;
  const mejorOfensiva = tabla.length
    ? tabla.reduce((best, team) => (team.gf > best.gf ? team : best), tabla[0])
    : null;

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
      } catch (err) {
        setError(
          `No fue posible cargar la tabla: ${extractApiErrorMessage(err)}`,
        );
      } finally {
        setLoading(false);
      }
    };
    cargarTabla();
  }, [temporadaActual?.id]);

  return (
    <div className="tabla-container">
      <LigaSelector />
      <header className="tabla-page-header">
        <h2>
          Tabla de Posiciones: {ligaActual?.nombre}{' '}
          {temporadaActual ? `- ${temporadaActual.nombre}` : ''}
        </h2>
        <p>
          Seguimiento competitivo por puntos, diferencia de gol y rendimiento
          general.
        </p>
      </header>

      {!!tabla.length && (
        <section className="tabla-insights">
          <article className="tabla-insight-card">
            <span className="insight-label">Mejor defensa </span>
            <strong>{mejorDefensa?.equipo} </strong>
            <span className="insight-value">{mejorDefensa?.gc ?? 0} GC</span>
          </article>
          <article className="tabla-insight-card">
            <span className="insight-label">Mejor ofensiva</span>
            <strong>{mejorOfensiva?.equipo} </strong>
            <span className="insight-value">{mejorOfensiva?.gf ?? 0} GF</span>
          </article>
        </section>
      )}

      {loading && <div className="loading-spinner">Cargando tabla...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !tabla.length && (
        <div className="no-data">
          No hay datos para la temporada seleccionada.
        </div>
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
              {tabla.map((row, index) => (
                <tr
                  key={row.equipoId}
                  className={`${index < 8 ? 'liguilla-zone' : ''} ${index === 0 ? 'is-first' : ''}`}
                >
                  <td className="posicion">
                    <span className="rank-pill">{row.posicion}</span>
                  </td>
                  <td className="equipo-nombre">{row.equipo}</td>
                  <td>{row.pj}</td>
                  <td className="ganados">{row.pg}</td>
                  <td>{row.pe}</td>
                  <td className="perdidos">{row.pp}</td>
                  <td>{row.gf}</td>
                  <td>{row.gc}</td>
                  <td
                    className={`diferencia ${row.dg > 0 ? 'positiva' : row.dg < 0 ? 'negativa' : ''}`}
                  >
                    {row.dg > 0 ? `+${row.dg}` : row.dg}
                  </td>
                  <td className="puntos">
                    <span className="points-pill">{row.pts}</span>
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

export default TablaPosiciones;
