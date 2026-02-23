import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>SoccerGDL</h1>
        <p>
          Opera ligas de futbol 7 con datos en tiempo real, control deportivo y
          experiencia profesional.
        </p>
        <p>
          Implementacion inicial: <strong>Liga Pro Soccer Femenil</strong>.
        </p>
        <div className="hero-metrics">
          <article className="hero-metric-card">
            <span className="hero-metric-label">Canchas activas</span>
            <strong>4</strong>
          </article>
          <article className="hero-metric-card">
            <span className="hero-metric-label">Ventana operativa</span>
            <strong>7 dias</strong>
          </article>
          <article className="hero-metric-card">
            <span className="hero-metric-label">Modelo</span>
            <strong>Multi-liga</strong>
          </article>
        </div>
      </div>

      <section className="features-section">
        <h2>Canchas Sede</h2>
        <article className="feature-card canchas-resumen-card">
          <h3>Contamos con 4 canchas de futbol 7</h3>
          <p>
            El complejo SoccerGDL tiene 4 canchas activas para partidos de liga,
            amistosos y entrenamientos. Todas cuentan con iluminacion para juego
            nocturno, zonas de banca y acceso para arbitraje.
          </p>
          <p>
            Organizamos jornadas simultaneas, reprogramaciones y asignacion de
            cancha por categoria para mantener un flujo ordenado durante toda la
            temporada.
          </p>
        </article>
      </section>

      <section className="info-section">
        <article className="info-card">
          <h3>Ubicacion</h3>
          <ul className="contacto-lista">
            <li>Complejo SoccerGDL</li>
            <li>Av. Mariano Otero 1450, Guadalajara, Jalisco</li>
            <li>Referencia: cerca de Plaza del Sol</li>
          </ul>
        </article>

        <article className="info-card">
          <h3>Horarios de Operacion</h3>
          <ul className="dias-lista">
            <li>
              <span className="dia">Lunes a Viernes</span>
              <span className="horario">16:00 - 23:00</span>
            </li>
            <li>
              <span className="dia">Sabado</span>
              <span className="horario">08:00 - 22:00</span>
            </li>
            <li>
              <span className="dia">Domingo</span>
              <span className="horario">08:00 - 20:00</span>
            </li>
          </ul>
        </article>

        <article className="info-card">
          <h3>Contacto</h3>
          <ul className="contacto-lista">
            <li>Telefono: (33) 1234 5678</li>
            <li>WhatsApp: (33) 9876 5432</li>
            <li>Correo: contacto@soccergdl.com</li>
          </ul>
          <p className="info-note">
            Para apartar cancha o resolver dudas de jornada, contacta por
            WhatsApp.
          </p>
        </article>
      </section>
    </div>
  );
};

export default Home;
