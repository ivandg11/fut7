import React from 'react';
import './Home.css';

const Home = () => {
  const logoSrc = `${process.env.PUBLIC_URL}/logo.png`;

  return (
    <div className="home-container">
      <div className="hero-section">
        <img src={logoSrc} alt="Soccer GDL" className="hero-logo" />
        <p>
          Somos para ti la mejor opcion para desarrollar tus habilidades
          desportivas , en un ambiente motivacional y de competencia.
        </p>

        <div className="hero-metrics">
          <article className="hero-metric-card">
            <span className="hero-metric-label">Canchas</span>
            <strong>4</strong>
          </article>
          <article className="hero-metric-card">
            <span className="hero-metric-label">Dias de operacion</span>
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
            <li>SoccerGDL</li>
            <li>
              Avenida Periférico Poniente Manuel Gómez Morin 6420, Paraísos del
              Colli, 45060 Zapopan, Jal.
            </li>
            <li>
              <a
                href="https://maps.app.goo.gl/b8U7Zz9tDES6otXh9"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver en Google Maps
              </a>
            </li>
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
