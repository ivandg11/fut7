import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Soccer Park</h1>
        <p>La mejor liga de futbol 7 </p>
        <div className="hero-buttons">
          <Link to="/tabla" className="btn-hero">
            Ver Tabla de Posiciones
          </Link>
          <Link to="/partidos" className="btn-hero btn-secondary">
            Ver Próximos Partidos
          </Link>
        </div>
      </div>

      <div className="features-section">
        <h2>Características de la Liga</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Tabla de Posiciones</h3>
            <p>
              Seguimiento en tiempo real de puntos, goles y estadísticas de
              todos los equipos
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Partidos Semanales</h3>
            <p>
              Lunes a Sábado, dos canchas disponibles con horarios de 7pm a 10pm
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Torneo Regular</h3>
            <p>Todos contra todos, los mejores 4 clasifican a semifinales</p>
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="info-card">
          <h3>📅 Días de Juego</h3>
          <ul className="dias-lista">
            <li>
              <span className="dia">Lunes</span>{' '}
              <span className="horario">7:00pm - 11:00pm</span>
            </li>
            <li>
              <span className="dia">Martes</span>{' '}
              <span className="horario">7:00pm - 11:00pm</span>
            </li>
            <li>
              <span className="dia">Miércoles</span>{' '}
              <span className="horario">7:00pm - 11:00pm</span>
            </li>
            <li>
              <span className="dia">Jueves</span>{' '}
              <span className="horario">7:00pm - 11:00pm</span>
            </li>
            <li>
              <span className="dia">Viernes</span>{' '}
              <span className="horario">7:00pm - 11:00pm</span>
            </li>
            <li>
              <span className="dia">Sábado</span>{' '}
              <span className="horario">8:00am - 1:00pm</span>
            </li>
          </ul>
        </div>

        <div className="info-card">
          <h3>🏟️ Canchas</h3>
          <ul className="canchas-lista">
            <li>
              <strong>Cancha 1:</strong> Principal (Gram sintético)
            </li>
            <li>
              <strong>Cancha 2:</strong> Alterna (Gram sintético)
            </li>
          </ul>
          <p className="info-note">Ambas canchas cuentan con iluminación LED</p>
        </div>

        <div className="info-card">
          <h3>📞 Contacto</h3>
          <ul className="contacto-lista">
            <li>📱 WhatsApp: 55-1234-5678</li>
            <li>📧 Email: ligafut7@contacto.com</li>
            <li>
              📍 Ubicación: Avenida Economos 6100, colonia Arcos de Guadalupe,
              Parque Metropolitano, Zapopan, Jalisco, México.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
