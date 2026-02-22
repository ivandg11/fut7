import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>SoccerGDL</h1>
        <p>Plataforma web escalable para ligas de futbol 7 en Guadalajara.</p>
        <p>
          Implementacion inicial: <strong>Liga Pro Soccer Femenil</strong>.
        </p>
        <div className="hero-buttons">
          <Link to="/tabla" className="btn-hero">
            Tabla en Tiempo Real
          </Link>
          <Link to="/goleo" className="btn-hero btn-secondary">
            Tabla de Goleo
          </Link>
          <Link to="/admin" className="btn-hero">
            Panel Admin JWT
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
