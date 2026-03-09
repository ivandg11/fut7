import React, { useEffect, useRef, useState } from 'react';
import './Home.css';

const Home = () => {
  const logoSrc = `${process.env.PUBLIC_URL}/logo.png`;
  const whatsappUrl =
    process.env.REACT_APP_WHATSAPP_URL || 'https://wa.me/523398765432';
  const facebookUrl =
    process.env.REACT_APP_FACEBOOK_URL || 'https://www.facebook.com/soccergdl';
  const instagramUrl =
    process.env.REACT_APP_INSTAGRAM_URL ||
    'https://www.instagram.com/soccergdl/';
  const slides = [
    {
      src: `${process.env.PUBLIC_URL}/img/s1.jpg`,
      alt: 'Publicidad Soccer GDL 1',
      title: 'Club Galaxy',
      description:
        'Pregunta por tu clase gratis y sin ningún compromiso para conocer nuestro trabajo.',
    },
    {
      src: `${process.env.PUBLIC_URL}/img/s2.jpg`,
      alt: 'Publicidad Soccer GDL 2',
      title: '',
      description:
        'Vivamos la pasion por el futbol! Categorías juveniles e infantiles, inscribe tu equipo hoy mismo ',
    },
    {
      src: `${process.env.PUBLIC_URL}/img/s3.jpg`,
      alt: 'Publicidad Soccer GDL 3',
      title: 'Liga femenil',
      description:
        'Prepárate para vivir una experiencia llena de pasión y talento, liga femenil dominical vespertina',
    },
    {
      src: `${process.env.PUBLIC_URL}/img/f4.jpg`,
      alt: 'Publicidad Soccer GDL 4',
      title: 'Liga infantil',
      description:
        'Vivamos la pasion por el futbol! Categorías infantiles (2012-2013) (2014-2015) (2016-2017) inscribe tu equipo hoy mismo ',
    },
    {
      src: `${process.env.PUBLIC_URL}/img/s5.jpg`,
      alt: 'Publicidad Soccer GDL 5',
      title: 'Campeon Pisteador',
      description:
        'Porque no solo reconocemos el esfuerzo dentro del terreno de juego, aquí los borrachos también ganan 🍻',
    },
  ];
  const [slideIndex, setSlideIndex] = useState(() =>
    Math.floor(Math.random() * slides.length),
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (isPaused) return undefined;
    const interval = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, [isPaused, slides.length]);

  useEffect(() => {
    setIsFlipped(false);
  }, [slideIndex]);

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
        <div className="home-slider-track">
          {slides.map((slide, index) => (
            <article
              className={`home-slide ${index === slideIndex ? 'active' : ''}`}
              key={slide.src}
              aria-hidden={index !== slideIndex}
            >
              <button
                type="button"
                className={`home-slide-frame ${index === slideIndex && isFlipped ? 'is-flipped' : ''}`}
                onClick={() => {
                  if (index === slideIndex) setIsFlipped((prev) => !prev);
                }}
                aria-label="Voltear slide para ver informacion"
              >
                <div className="home-slide-inner">
                  <div className="home-slide-face home-slide-front">
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      className="home-slide-image"
                    />
                  </div>
                  <div className="home-slide-face home-slide-back">
                    <div className="home-slide-back-kicker">Info</div>
                    <h4>{slide.title}</h4>
                    <p>{slide.description}</p>
                    <small>Click para volver</small>
                  </div>
                </div>
              </button>
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
          deportivas , en un ambiente motivacional y de competencia.
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
                <style>
                  {`
                    .info-card a {
                      color: #fbff00;
                      text-decoration: none;
                    }
                    .info-card a:hover {
                      text-decoration: underline;
                    }
                  `}
                </style>
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
            <li>Telefono: (33) 3397 7729</li>

            <li>Correo: soccer.gdl.7@gmail.com</li>
          </ul>
          <div
            className="social-links"
            aria-label="Redes sociales de SoccerGDL"
          >
            <a
              className="social-icon-btn"
              href="https://wa.me/523333977729"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp de SoccerGDL"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M20.52 3.48A11.86 11.86 0 0012.08 0C5.5 0 .16 5.34.16 11.92c0 2.1.55 4.16 1.6 5.97L0 24l6.3-1.65a11.9 11.9 0 005.78 1.49h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.17-3.49-8.44zm-8.43 18.34h-.01a9.94 9.94 0 01-5.07-1.39l-.36-.21-3.74.98 1-3.64-.23-.37a9.9 9.9 0 01-1.53-5.27c0-5.47 4.46-9.92 9.94-9.92 2.65 0 5.14 1.03 7.01 2.9a9.85 9.85 0 012.9 7.01c0 5.48-4.46 9.93-9.91 9.93zm5.45-7.43c-.3-.15-1.79-.89-2.07-.99-.27-.1-.47-.15-.66.15-.2.3-.77.99-.94 1.2-.17.2-.35.23-.65.08-.3-.15-1.25-.46-2.39-1.47a8.9 8.9 0 01-1.66-2.06c-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.66-1.6-.91-2.18-.24-.58-.49-.5-.66-.51h-.56c-.2 0-.52.07-.8.38-.28.3-1.05 1.03-1.05 2.52s1.07 2.92 1.22 3.12c.15.2 2.1 3.2 5.08 4.49.7.3 1.24.48 1.67.62.7.22 1.34.2 1.84.12.56-.08 1.79-.73 2.04-1.44.25-.7.25-1.3.18-1.43-.07-.13-.27-.2-.56-.35z" />
              </svg>
            </a>
            <a
              className="social-icon-btn"
              href="https://www.facebook.com/share/18GFThWbby/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook de SoccerGDL"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.44H7.08v-3.5h3.05V9.4c0-3.03 1.79-4.7 4.52-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.48 0-1.94.93-1.94 1.88v2.26h3.3l-.53 3.5h-2.77V24C19.61 23.1 24 18.1 24 12.07z" />
              </svg>
            </a>
            <a
              className="social-icon-btn"
              href="https://www.instagram.com/soccer.gdl?igsh=MW1pcHNlM3oxNzgwbA=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de SoccerGDL"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.22.41.56.22.97.49 1.39.91.42.42.69.83.91 1.39.16.42.36 1.05.41 2.22.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.22-.22.56-.49.97-.91 1.39-.42.42-.83.69-1.39.91-.42.16-1.05.36-2.22.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.22-.41a3.76 3.76 0 01-1.39-.91 3.76 3.76 0 01-.91-1.39c-.16-.42-.36-1.05-.41-2.22C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.22.22-.56.49-.97.91-1.39.42-.42.83-.69 1.39-.91.42-.16 1.05-.36 2.22-.41C8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.13.63a5.92 5.92 0 00-2.14 1.4A5.92 5.92 0 00.63 4.13c-.3.77-.5 1.65-.56 2.92C.01 8.33 0 8.74 0 12c0 3.26.01 3.67.07 4.95.06 1.27.26 2.15.56 2.92.31.8.73 1.48 1.4 2.14.66.67 1.34 1.09 2.14 1.4.77.3 1.65.5 2.92.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.92-.56a5.92 5.92 0 002.14-1.4 5.92 5.92 0 001.4-2.14c.3-.77.5-1.65.56-2.92.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.92a5.92 5.92 0 00-1.4-2.14A5.92 5.92 0 0019.87.63c-.77-.3-1.65-.5-2.92-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 105 12a6.16 6.16 0 007-6.16zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4zm6.4-11.84a1.44 1.44 0 11-1.44 1.44 1.44 1.44 0 011.44-1.44z" />
              </svg>
            </a>
          </div>
        </article>
      </section>
    </div>
  );
};

export default Home;
