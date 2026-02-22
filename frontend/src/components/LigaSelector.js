import React from 'react';
import { useLiga } from '../contexts/LigaContext';
import './LigaSelector.css';

const LigaSelector = () => {
  const {
    ligas,
    ligaActual,
    temporadas,
    temporadaActual,
    seleccionarLiga,
    seleccionarTemporada,
    loading,
    error,
  } = useLiga();

  if (loading) return <div className="liga-selector-loading">Cargando ligas...</div>;
  if (error) return <div className="liga-selector-error">{error}</div>;

  return (
    <div className="liga-selector">
      <div className="ligas-grid">
        <select
          className="liga-native-select"
          value={ligaActual?.id || ''}
          onChange={(e) => seleccionarLiga(e.target.value)}
        >
          {ligas.map((liga) => (
            <option key={liga.id} value={liga.id}>
              {liga.nombre} ({liga.tipo})
            </option>
          ))}
        </select>

        <select
          className="liga-native-select"
          value={temporadaActual?.id || ''}
          onChange={(e) => seleccionarTemporada(e.target.value)}
          disabled={!temporadas.length}
        >
          {temporadas.length === 0 && <option value="">Sin temporadas</option>}
          {temporadas.map((temporada) => (
            <option key={temporada.id} value={temporada.id}>
              {temporada.nombre} {temporada.anio}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LigaSelector;
