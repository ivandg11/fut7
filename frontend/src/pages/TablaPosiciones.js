import React, { useState, useEffect } from 'react';
import { useLiga } from '../contexts/LigaContext';
import { equiposAPI } from '../services/api';
import LigaSelector from '../components/LigaSelector';
import './TablaPosiciones.css';

const TablaPosiciones = () => {
  const { ligaActual } = useLiga();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');

  useEffect(() => {
    if (ligaActual) {
      cargarEquipos();
    }
  }, [ligaActual]);

  const cargarEquipos = async () => {
    setLoading(true);
    try {
      const response = await equiposAPI.getByLiga(ligaActual.dia);
      // Ordenar por puntos (desc), luego por diferencia de goles
      const equiposOrdenados = response.data.sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        const dgA = a.golesFavor - a.golesContra;
        const dgB = b.golesFavor - b.golesContra;
        return dgB - dgA;
      });
      setEquipos(equiposOrdenados);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const equiposFiltrados = equipos.filter(equipo => {
    if (filter === 'conPuntos') return equipo.puntos > 0;
    if (filter === 'conPartidos') return equipo.partidosJugados > 0;
    return true;
  });

  if (loading) {
    return (
      <div className="tabla-container">
        <LigaSelector />
        <div className="loading-spinner">Cargando tabla de posiciones...</div>
      </div>
    );
  }

  return (
    <div className="tabla-container">
      <LigaSelector />
      
      <div className="tabla-header">
        <div>
          <h2>🏆 {ligaActual?.nombre}</h2>
          <p className="liga-dia-subtitle">{ligaActual?.dia}</p>
        </div>
        
        <div className="filtros">
          <button 
            className={`filtro-btn ${filter === 'todos' ? 'active' : ''}`}
            onClick={() => setFilter('todos')}
          >
            Todos
          </button>
          <button 
            className={`filtro-btn ${filter === 'conPuntos' ? 'active' : ''}`}
            onClick={() => setFilter('conPuntos')}
          >
            Con puntos
          </button>
          <button 
            className={`filtro-btn ${filter === 'conPartidos' ? 'active' : ''}`}
            onClick={() => setFilter('conPartidos')}
          >
            Con partidos
          </button>
        </div>
      </div>

      {equiposFiltrados.length === 0 ? (
        <div className="no-data">
          <p>No hay equipos registrados en esta liga</p>
        </div>
      ) : (
        <div className="tabla-wrapper">
          <table className="tabla-posiciones">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Equipo</th>
                <th>PJ</th>
                <th>PG</th>
                <th>PE</th>
                <th>PP</th>
                <th>GF</th>
                <th>GC</th>
                <th>DG</th>
                <th>PTS</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {equiposFiltrados.map((equipo, index) => {
                const partidosGanados = Math.floor(equipo.puntos / 3);
                const partidosEmpatados = equipo.partidosJugados - partidosGanados - (equipo.partidosJugados - partidosGanados - (equipo.puntos % 3));
                const partidosPerdidos = equipo.partidosJugados - partidosGanados - partidosEmpatados;
                const porcentaje = equipo.partidosJugados > 0 
                  ? ((equipo.puntos / (equipo.partidosJugados * 3)) * 100).toFixed(1)
                  : '0';
                
                return (
                  <tr key={equipo.id} className={index < 4 ? 'top-4' : ''}>
                    <td className="posicion">{index + 1}</td>
                    <td className="equipo-nombre">
                      {equipo.nombre}
                    </td>
                    <td>{equipo.partidosJugados}</td>
                    <td className="ganados">{partidosGanados}</td>
                    <td className="empatados">{partidosEmpatados}</td>
                    <td className="perdidos">{partidosPerdidos}</td>
                    <td className="goles-favor">{equipo.golesFavor}</td>
                    <td className="goles-contra">{equipo.golesContra}</td>
                    <td className={`diferencia ${equipo.golesFavor - equipo.golesContra >= 0 ? 'positiva' : 'negativa'}`}>
                      {equipo.golesFavor - equipo.golesContra}
                    </td>
                    <td className="puntos">{equipo.puntos}</td>
                    <td className="porcentaje">{porcentaje}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="leyenda">
        <div className="leyenda-item">
          <span className="color-box top4"></span>
          <span>Clasificación a playoffs (Top 4)</span>
        </div>
        <div className="leyenda-item">
          <span>PJ: Partidos Jugados | PG: Ganados | PE: Empatados | PP: Perdidos</span>
        </div>
        <div className="leyenda-item">
          <span>GF: Goles Favor | GC: Goles Contra | DG: Diferencia | PTS: Puntos</span>
        </div>
      </div>
    </div>
  );
};

export default TablaPosiciones;
