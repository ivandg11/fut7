import React from 'react';
import { Link } from 'react-router-dom';
import { useAccess } from '../contexts/AccessContext';
import './NavBar.css';

const NavBar = () => {
  const { rol, solicitarAcceso, cerrarSesion } = useAccess();

  const getRolNombre = () => {
    switch (rol) {
      case 'admin':
        return 'Administrador';
      case 'editor':
        return 'Editor';
      default:
        return 'Invitado';
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">Soccer Park</Link>
      </div>

      <div className="nav-links">
        <Link to="/">Inicio</Link>
        <Link to="/tabla">Tabla</Link>
        {(rol === 'admin' || rol === 'editor') && (
          <Link to="/equipos">Equipos</Link>
        )}
        <Link to="/partidos">Partidos</Link>
      </div>

      <div className="nav-access">
        <span className="rol-badge"> {getRolNombre()}</span>

        {rol === 'publico' && (
          <>
            <button
              onClick={() => solicitarAcceso('editor')}
              className="btn-editor"
            >
              Eres silla?
            </button>
            <button
              onClick={() => solicitarAcceso('admin')}
              className="btn-admin"
            >
              Eres admin?
            </button>
          </>
        )}

        {(rol === 'editor' || rol === 'admin') && (
          <button onClick={cerrarSesion} className="btn-logout">
            Cerrar Sesión
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
