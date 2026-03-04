import React, { useEffect, useRef, useState } from 'react';
import './Home.css';

const Home = () => {
  const logoSrc = `${process.env.PUBLIC_URL}/logo.png`;
  const slides = [
    {
      src: `${process.env.PUBLIC_URL}/img/s1.jpg`,
      alt: 'Academia de futbol Galaxy GDL',
      title: 'Academia de Futbol Galaxy GDL',
      description: 'Entrenamientos para ninos, adultos y porteros.',
    },
    {
      src: `${process.env.PUBLIC_URL}/img/s2.jpg`,
      alt: 'Inscripciones abiertas en Soccer GDL',
      title: 'Inscripciones Abiertas',
      description: 'Categorias juveniles disponibles para nueva temporada.',
    },
    {
      src: `${process.env.PUBLIC_URL}/img/s3.jpg`,
      alt: 'Promocion de inscripcion en Soccer GDL',
      title: 'Promociones Activas',
      description: 'Consulta disponibilidad y promociones vigentes.',
    },
  ];
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (isPaused) return undefined;
    const interval = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, [isPaused, slides.length]);

  const goToSlide = (index) => {
    setSlideIndex(index);
  };

  const goPrev = () => {
    setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const onTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0].clientX;
  };

  const onTouchEnd = (event) => {
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  return (
    <div className="home-container">
      <section
        className="home-slider"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="home-slider-track"
          style={{ transform: `translateX(-${slideIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <article className="home-slide" key={slide.src}>
              <img src={slide.src} alt={slide.alt} className="home-slide-image" />
              <div className="home-slide-overlay" />
              <div className="home-slide-content">
                <p className="home-slide-kicker">Soccer GDL</p>
                <h2>{slide.title}</h2>
                <p>{slide.description}</p>
                <div className="home-slide-actions">
                  <a
                    href="https://wa.me/523333977729"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Solicitar informes
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="home-slider-arrow left"
          onClick={goPrev}
          aria-label="Slide anterior"
        >
          &#10094;
        </button>
        <button
          type="button"
          className="home-slider-arrow right"
          onClick={goNext}
          aria-label="Siguiente slide"
        >
          &#10095;
        </button>

        <div className="home-slider-dots">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.src}
              className={`home-slider-dot ${index === slideIndex ? 'active' : ''}`}
              aria-label={`Ir al slide ${index + 1}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </section>

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
