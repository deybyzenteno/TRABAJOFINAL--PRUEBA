import { NavLink } from 'react-router-dom';
import NavHamburguesa from './NavHamburguesa';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar-sg">
      
      {/* CONTENEDOR IZQUIERDO: Hambuguesa + Título (Logo y Texto) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="navbar-hamburguesa-container">
          <NavHamburguesa />
        </div>
        
        {/* TÍTULO CON LOGO Y TEXTO (NO ES UN ENLACE) */}
        <h1 className="navbar-title-logo">
          <img 
            src="/img/logo2.png" 
            alt="Logo SG" 
            className="navbar-logo-image" 
          />
          <span className="navbar-title-text">Servicio Técnico</span>
        </h1>
      </div>
      {/* Fin del Título */}

      <ul className="navbar-links-right">
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Inicio
          </NavLink>
        </li>
        <li>
          <NavLink to="/productos" className={({ isActive }) => isActive ? 'active' : ''}>
            Productos
          </NavLink>
        </li>
         <li>
          <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
            Login
          </NavLink>
        </li>
        <li>
          <NavLink to="/servicios" className={({ isActive }) => isActive ? 'active' : ''}>
            Ayuda
          </NavLink>
        </li>
       
      </ul>
    </nav>
  );
}

export default Navbar;