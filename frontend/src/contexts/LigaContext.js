import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ligasAPI, temporadasAPI } from '../services/api';

const LigaContext = createContext(null);

export const useLiga = () => {
  const context = useContext(LigaContext);
  if (!context) {
    throw new Error('useLiga debe usarse dentro de LigaProvider');
  }
  return context;
};

export const LigaProvider = ({ children }) => {
  const [ligas, setLigas] = useState([]);
  const [ligaActualId, setLigaActualId] = useState(null);
  const [temporadas, setTemporadas] = useState([]);
  const [temporadaActualId, setTemporadaActualId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const ligaActual = ligas.find((l) => l.id === ligaActualId) || null;
  const temporadaActual = temporadas.find((t) => t.id === temporadaActualId) || null;

  const cargarLigas = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ligasAPI.getAll();
      const leagues = response.data;
      setLigas(leagues);

      if (leagues.length === 0) {
        setLigaActualId(null);
        setTemporadas([]);
        setTemporadaActualId(null);
        return;
      }

      const selectedLigaId =
        leagues.some((l) => l.id === ligaActualId) ? ligaActualId : leagues[0].id;
      setLigaActualId(selectedLigaId);
      await cargarTemporadas(selectedLigaId);
    } catch (_error) {
      setError('No fue posible cargar ligas');
    } finally {
      setLoading(false);
    }
  };

  const cargarTemporadas = async (ligaId) => {
    if (!ligaId) return;
    try {
      const response = await temporadasAPI.getByLiga(ligaId);
      const seasons = response.data;
      setTemporadas(seasons);

      if (seasons.length === 0) {
        setTemporadaActualId(null);
        return;
      }

      const activa = seasons.find((season) => season.activa);
      const nextTemporadaId =
        seasons.some((season) => season.id === temporadaActualId)
          ? temporadaActualId
          : (activa?.id || seasons[0].id);

      setTemporadaActualId(nextTemporadaId);
    } catch (_error) {
      setTemporadas([]);
      setTemporadaActualId(null);
      setError('No fue posible cargar temporadas');
    }
  };

  const seleccionarLiga = async (ligaId) => {
    setLigaActualId(Number(ligaId));
    await cargarTemporadas(Number(ligaId));
  };

  useEffect(() => {
    cargarLigas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      ligas,
      ligaActual,
      temporadas,
      temporadaActual,
      loading,
      error,
      cargarLigas,
      cargarTemporadas,
      seleccionarLiga,
      seleccionarTemporada: (id) => setTemporadaActualId(Number(id)),
    }),
    [error, ligaActual, ligas, loading, temporadaActual, temporadas],
  );

  return <LigaContext.Provider value={value}>{children}</LigaContext.Provider>;
};
