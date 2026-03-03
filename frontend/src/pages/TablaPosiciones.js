import React, { useEffect, useState } from 'react';
import { useAccess } from '../contexts/AccessContext';
import { useLiga } from '../contexts/LigaContext';
import { equiposAPI, estadisticasAPI, extractApiErrorMessage } from '../services/api';
import LigaSelector from '../components/LigaSelector';
import './TablaPosiciones.css';

const TablaPosiciones = () => {
  const { isAdmin } = useAccess();
  const { ligaActual, temporadaActual } = useLiga();
  const [tabla, setTabla] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adjustingTeamId, setAdjustingTeamId] = useState(null);

  const mejorDefensa = tabla.length
    ? tabla.reduce((best, team) => (team.gc < best.gc ? team : best), tabla[0])
    : null;
  const mejorOfensiva = tabla.length
    ? tabla.reduce((best, team) => (team.gf > best.gf ? team : best), tabla[0])
    : null;

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

  const ajustarPuntos = async (equipoId, delta) => {
    setError('');
    try {
      setAdjustingTeamId(equipoId);
      await equiposAPI.ajustarPuntos(equipoId, delta);
      await cargarTabla();
    } catch (err) {
      setError(
        `No fue posible ajustar puntos: ${extractApiErrorMessage(err)}`,
      );
    } finally {
      setAdjustingTeamId(null);
    }
  };

  useEffect(() => {
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
          <article className="tabla-insight-card defensa">
            <span className="insight-label">Mejor defensa</span>
            <strong>{mejorDefensa?.equipo}</strong>
            <span className="insight-value">{mejorDefensa?.gc ?? 0} GC</span>
          </article>
          <article className="tabla-insight-card ofensiva">
            <span className="insight-label">Mejor ofensiva</span>
            <strong>{mejorOfensiva?.equipo}</strong>
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
                  className={`${index < 8 ? 'liguilla-zone' : ''} ${index === 0 ? 'is-first' : ''} ${row.equipoId === mejorDefensa?.equipoId ? 'is-best-defense' : ''} ${row.equipoId === mejorOfensiva?.equipoId ? 'is-best-offense' : ''}`}
                >
                  <td className="posicion">
                    <span className="rank-pill">{row.posicion}</span>
                  </td>
                  <td className="equipo-nombre">{row.equipo}</td>
                  <td>{row.pj}</td>
                  <td className="ganados">{row.pg}</td>
                  <td>{row.pe}</td>
                  <td className="perdidos">{row.pp}</td>
                  <td className={row.equipoId === mejorOfensiva?.equipoId ? 'metric-highlight offense' : ''}>{row.gf}</td>
                  <td className={row.equipoId === mejorDefensa?.equipoId ? 'metric-highlight defense' : ''}>{row.gc}</td>
                  <td
                    className={`diferencia ${row.dg > 0 ? 'positiva' : row.dg < 0 ? 'negativa' : ''}`}
                  >
                    {row.dg > 0 ? `+${row.dg}` : row.dg}
                  </td>
                  <td className="puntos">
                    <div className="points-actions-wrap">
                      <span className="points-pill">{row.pts}</span>
                      {isAdmin && (
                        <span className="points-mini-actions">
                          <button
                            type="button"
                            className="pts-mini-btn minus"
                            onClick={() => ajustarPuntos(row.equipoId, -1)}
                            disabled={adjustingTeamId === row.equipoId}
                            title="Restar 1 punto por penalizacion"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            className="pts-mini-btn plus"
                            onClick={() => ajustarPuntos(row.equipoId, 1)}
                            disabled={adjustingTeamId === row.equipoId}
                            title="Sumar 1 punto de ajuste"
                          >
                            +
                          </button>
                        </span>
                      )}
                    </div>
                    {isAdmin && !!row.ajustePts && (
                      <div className="points-adjust-note">
                        Ajuste: {row.ajustePts > 0 ? `+${row.ajustePts}` : row.ajustePts}
                      </div>
                    )}
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
