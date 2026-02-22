import React from 'react';
import { Link } from 'react-router-dom';
import { useAccess } from '../contexts/AccessContext';
import './NavBar.css';

const NavBar = () => {
  const { user, role, isAdmin, logout } = useAccess();

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">SoccerGDL</Link>
      </div>

      <div className="nav-links">
        <Link to="/">Inicio</Link>
        <Link to="/tabla">Tabla</Link>
        <Link to="/goleo">Goleo</Link>
        <Link to="/partidos">Partidos</Link>
        {isAdmin && <Link to="/admin">Panel Admin</Link>}
      </div>

      <div className="nav-access">
        <span className="rol-badge">{role}</span>
        {isAdmin ? (
          <button onClick={logout} className="btn-logout">
            Salir ({user?.nombre || 'Admin'})
          </button>
        ) : (
          <Link to="/admin" className="btn-admin">
            Ingresar
          </Link>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
