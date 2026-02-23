import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAccess } from '../contexts/AccessContext';
import './NavBar.css';

const NavBar = () => {
  const { user, isAdmin, logout } = useAccess();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-brand-row">
        <div className="nav-brand">
          <Link to="/" onClick={closeMenu}>
            SoccerGDL
          </Link>
        </div>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-label="Abrir menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`nav-collapse ${menuOpen ? 'open' : ''}`}>
        <div className="nav-links">
          <NavLink to="/" onClick={closeMenu}>
            Inicio
          </NavLink>
          <NavLink to="/tabla" onClick={closeMenu}>
            Tabla
          </NavLink>
          <NavLink to="/goleo" onClick={closeMenu}>
            Goleo
          </NavLink>
          <NavLink to="/partidos" onClick={closeMenu}>
            Partidos
          </NavLink>

          {isAdmin && (
            <NavLink to="/equipos" onClick={closeMenu}>
              Equipos
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/temporadas" onClick={closeMenu}>
              Temporadas
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" onClick={closeMenu}>
              Panel Admin
            </NavLink>
          )}
        </div>

        <div className="nav-access">
          {isAdmin ? (
            <button
              onClick={() => {
                logout();
                closeMenu();
              }}
              className="btn-logout"
            >
              Salir ({user?.nombre || 'Admin'})
            </button>
          ) : (
            <Link to="/admin" className="btn-admin" onClick={closeMenu}>
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
