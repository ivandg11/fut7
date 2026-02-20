import React, { createContext, useEffect, useState, useContext } from 'react';
import { authAPI } from '../services/api';

const AccessContext = createContext();

export const useAccess = () => useContext(AccessContext);

export const AccessProvider = ({ children }) => {
  const [rol, setRol] = useState('publico');
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [claveInput, setClaveInput] = useState('');
  const [tipoAcceso, setTipoAcceso] = useState('');

  useEffect(() => {
    const savedRol = sessionStorage.getItem('userRol');
    if (savedRol) {
      setRol(savedRol);
    }
  }, []);

  const solicitarAcceso = (tipo) => {
    setTipoAcceso(tipo);
    setShowAccessModal(true);
    setClaveInput('');
  };

  const verificarClave = async () => {
    try {
      const clave = claveInput.trim();
      if (!clave) {
        alert('Ingresa una clave');
        return false;
      }

      const response = await authAPI.verificarClave(tipoAcceso, clave);
      const rolValidado = response.data?.rol || tipoAcceso;

      setRol(rolValidado);
      sessionStorage.setItem('userRol', rolValidado);
      sessionStorage.setItem('userClave', clave);
      setShowAccessModal(false);
      return true;
    } catch (error) {
      alert(error.response?.data?.message || 'Error al verificar clave');
      return false;
    }
  };

  const cerrarSesion = () => {
    setRol('publico');
    sessionStorage.removeItem('userRol');
    sessionStorage.removeItem('userClave');
  };

  const value = {
    rol,
    showAccessModal,
    setShowAccessModal,
    claveInput,
    setClaveInput,
    tipoAcceso,
    solicitarAcceso,
    verificarClave,
    cerrarSesion,
  };

  return (
    <AccessContext.Provider value={value}>
      {children}
      <AccessModal />
    </AccessContext.Provider>
  );
};

const AccessModal = () => {
  const {
    showAccessModal,
    setShowAccessModal,
    claveInput,
    setClaveInput,
    tipoAcceso,
    verificarClave,
  } = useAccess();

  if (!showAccessModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content access-modal">
        <h3>Acceso de {tipoAcceso === 'admin' ? 'Administrador' : 'Editor'}</h3>
        <p className="access-text">
          Ingresa la clave para obtener permisos de {tipoAcceso}
        </p>
        <input
          type="password"
          className="access-input"
          value={claveInput}
          onChange={(e) => setClaveInput(e.target.value)}
          placeholder="Clave de acceso"
          autoFocus
        />
        <div className="modal-actions">
          <button onClick={verificarClave} className="btn-primary">
            Acceder
          </button>
          <button
            onClick={() => setShowAccessModal(false)}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
