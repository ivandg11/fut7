import React from 'react';
import { useLiga } from '../contexts/LigaContext';
import './LigaSelector.css';

const DIAS = [
  { id: 'LUNES', nombre: 'Lunes', color: '#127412' },
  { id: 'MARTES', nombre: 'Martes', color: '#127412' },
  { id: 'MIERCOLES', nombre: 'Miércoles', color: '#127412' },
  { id: 'JUEVES', nombre: 'Jueves', color: '#127412' },
  { id: 'VIERNES', nombre: 'Viernes', color: '#127412' },
  { id: 'SABADO', nombre: 'Sábado', color: '#127412' }
];

const LigaSelector = () => {
  const { ligaActual, seleccionarLiga, loading, error } = useLiga();

  console.log('LigaSelector - ligaActual:', ligaActual);

  const handleClick = (dia) => {
    console.log('Botón clickeado para día:', dia);
    seleccionarLiga(dia);
  };

  if (loading) {
    return <div className="liga-selector-loading">Cargando ligas...</div>;
  }

  if (error) {
    return <div className="liga-selector-error">{error}</div>;
  }

  return (
    <div className="liga-selector">
      <h3>Selecciona la Liga:</h3>
      <div className="ligas-grid">
        {DIAS.map(dia => (
          <button
            key={dia.id}
            className={`liga-btn ${ligaActual?.dia === dia.id ? 'active' : ''}`}
            style={{ backgroundColor: dia.color }}
            onClick={() => handleClick(dia.id)}
            type="button"
          >
            <span className="liga-dia">{dia.nombre}</span>
            <span className="liga-nombre">Liga {dia.nombre}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LigaSelector;