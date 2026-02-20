import React, { createContext, useState, useContext, useEffect } from 'react';
import { ligasAPI } from '../services/api';

const LigaContext = createContext();

export const useLiga = () => {
  const context = useContext(LigaContext);
  if (!context) {
    throw new Error('useLiga debe ser usado dentro de LigaProvider');
  }
  return context;
};

export const LigaProvider = ({ children }) => {
  const [ligas, setLigas] = useState([]);
  const [ligaActual, setLigaActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jornadaActual, setJornadaActual] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarLigas();
  }, []);

  const cargarLigas = async () => {
    try {
      setLoading(true);
      console.log('Cargando ligas...');
      const response = await ligasAPI.getAll();
      console.log('Ligas cargadas:', response.data);
      setLigas(response.data);
      
      // Seleccionar la primera liga por defecto (Lunes)
      if (response.data.length > 0 && !ligaActual) {
        console.log('Seleccionando liga por defecto:', response.data[0]);
        setLigaActual(response.data[0]);
      }
      setError(null);
    } catch (error) {
      console.error('Error al cargar ligas:', error);
      setError('Error al cargar las ligas');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarLiga = (dia) => {
    console.log('Seleccionando liga con día:', dia);
    const liga = ligas.find(l => l.dia === dia);
    if (liga) {
      console.log('Liga encontrada:', liga);
      setLigaActual(liga);
      setJornadaActual(1);
    } else {
      console.log('No se encontró liga para el día:', dia);
    }
  };

  const value = {
    ligas,
    ligaActual,
    loading,
    error,
    jornadaActual,
    setJornadaActual,
    seleccionarLiga,
    cargarLigas
  };

  return (
    <LigaContext.Provider value={value}>
      {children}
    </LigaContext.Provider>
  );
};