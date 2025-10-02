import { useState } from 'react';
import { FaBars, FaTimes, FaHome, FaServicestack, FaSignInAlt, FaInfoCircle, FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './NavHamburguesa.css';

const menuItems = [
  { nombre: 'Inicio', to: '/', icon: <FaHome /> },
  { nombre: 'Productos', to: '/productos', icon: <FaShoppingCart /> },
  { nombre: 'Servicios', to: '/servicios', icon: <FaServicestack /> },
  { nombre: 'Login', to: '/login', icon: <FaSignInAlt /> },
  // { nombre: 'Acerca de Nosotros', to: '/acerca', icon: <FaInfoCircle /> },
];

function NavHamburguesa() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={`nav-hamburguesa-btn${open ? ' active' : ''}`} onClick={() => setOpen(true)} aria-label="Abrir menú">
        <FaBars size={28} />
      </button>
      <div className={`nav-hamburguesa-menu${open ? ' open' : ''}`}>
        <div className="nav-hamburguesa-header">
          <span>Menú</span>
          <button className="nav-hamburguesa-close" onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <FaTimes size={24} />
          </button>
        </div>
        <ul className="nav-hamburguesa-list">
          {menuItems.map(item => (
            <li key={item.to}>
              <Link to={item.to} className="nav-hamburguesa-link" onClick={() => setOpen(false)}>
                <span className="nav-hamburguesa-icon">{item.icon}</span>
                {item.nombre}
              </Link>
            </li>
          ))}
        </ul>
  </div>
      {open && <div className="nav-hamburguesa-overlay" onClick={() => setOpen(false)}></div>}
    </>
  );
}

export default NavHamburguesa;
