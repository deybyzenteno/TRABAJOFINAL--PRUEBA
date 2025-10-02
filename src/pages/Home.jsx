import "./Home.css";
import {FaInstagram, FaWhatsapp, FaMobileAlt, FaLaptop, FaVolumeUp, FaChevronDown, FaMapMarkerAlt, FaHeadset, FaTools } from "react-icons/fa";
import { useState, useEffect } from "react";


function Home() {
  const alertaActiva = true;
  const mensajeAlerta =
    "Hoy no estamos atendiendo por viaje, disculpen las molestias.";

  const [showAlert, setShowAlert] = useState(alertaActiva);

  // Carrusel desktop
  const images = [
    "/img/fondo4.png",
    "/img/fondo2.png",
    "/img/fondo3.png",
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const nextSlide = () => setCurrent((current + 1) % images.length);
  const prevSlide = () =>
    setCurrent((current - 1 + images.length) % images.length);

  return (
    <div className="home-container">
      {/* Banner de alerta */}
      {showAlert && (
        <div className="alert-banner">
          <span>{mensajeAlerta}</span>
          <button className="close-alert" onClick={() => setShowAlert(false)}>
            ×
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="hero">
        {/* Imagen para móviles */}
        <div
          className="mobile-only-slide"
          style={{ backgroundImage: "url('/img/image.png')" }}
        ></div>

        {/* Carrusel desktop */}
        <div className="hero-slider">
          {images.map((img, index) => (
            <div
              key={index}
              className={`slide ${index === current ? "active" : ""}`}
              style={{ backgroundImage: `url(${img})` }}
            ></div>
          ))}
          <button className="prev" onClick={prevSlide} aria-label="Anterior">
            ❮
          </button>
          <button className="next" onClick={nextSlide} aria-label="Siguiente">
            ❯
          </button>
        </div>

        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">SERVICIO TÉCNICO</h1>
            <p className="hero-subtitle">
              Reparamos celulares, computadoras y parlantes de manera profesional
            </p>
            <FaChevronDown className="scroll-down" size={35} />
            <FaChevronDown className="scroll-down" size={40} />
          </div>
        </div>
      </div>

      {/* Servicios */}
      <section className="about-us">
        <h2>Servicios Destacados</h2>
        <div className="services-cards">
          <div className="service-card">
            <FaMobileAlt size={50} color="#fff" />
            <h3>Celulares</h3>
            <p>Reparación rápida y confiable de pantallas, baterías y software.</p>
          </div>
          <div className="service-card">
            <FaLaptop size={50} color="#fff" />
            <h3>Computadoras</h3>
            <p>Mantenimiento de PC, optimización, limpieza y upgrades.</p>
          </div>
          <div className="service-card">
            <FaTools size={50} color="#fff" />
            <h3>Soporte Técnico</h3>
            <p>  Te brindamos asistencia remota para resolver problemas de software 
            y configuraciones de manera rápida y segura.</p>
          </div>
        
        </div>
      </section>

      {/* Ubicación */}
      <section className="location">
        <h2>¿Por qué elegirnos?</h2>
        <p>
          Con más de 3 años de experiencia en reparaciones, ofrecemos soluciones
          rápidas, garantía en todos nuestros trabajos y atención personalizada.
        </p>
      </section>

      {/* Redes sociales */}
      <section className="socials">
        <h2>Contáctanos</h2>
        <p><FaMapMarkerAlt /> Av Sarmiento 2da cuadra - San Pedro de Colalao</p>
      <p>
  <span className="emoji">✉️</span>{" "}
  <a href="mailto:deybydeleon@gmail.com" className="email-link">
    deybydeleon@gmail.com
  </a>
</p>
{/* <p>
  <span className="emoji">📞</span>{" "}
  <a href="tel:+543816491380" className="phone-link">
    +54 3816491380
  </a>
</p> */}

<div className="social-icons">
  <a
    href="https://instagram.com/"
    target="_blank"
    rel="noreferrer"
    className="instagram"
  >
    <FaInstagram size={35} />
  </a>
  <a
    href="https://wa.me/543816491380"
    target="_blank"
    rel="noreferrer"
    className="whatsapp"
  >
    <FaWhatsapp size={35} />
  </a>
</div>
</section>

{/* Footer */}
<footer className="home-footer">
        <p>© 2025 SG Servicios Técnicos - Todos los derechos reservados</p>
    </footer>
</div>
);
}

export default Home;
