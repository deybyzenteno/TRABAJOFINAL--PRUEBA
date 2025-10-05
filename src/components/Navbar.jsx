// Navbar.jsx

import { NavLink } from 'react-router-dom';
import NavHamburguesa from './NavHamburguesa';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { FaTools } from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: '¿Seguro que quieres cerrar sesión?',
      text: "Tendrás que iniciar sesión nuevamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();

        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión correctamente.',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        });

        setTimeout(() => navigate("/"), 2000);
      }
    });
  };

  // Determina la clase del Navbar principal para manejar la alineación CSS
  const navbarClass = user?.role === 'admin' ? 'navbar-sg navbar-admin-mode' : 'navbar-sg';

  return (
    <nav className={navbarClass}>
      
      {/* 1. SECCIÓN IZQUIERDA: Logo + Hamburguesa */}
      <div className="navbar-section-left">
        <div className="navbar-hamburguesa-container">
          <NavHamburguesa />
        </div>
        <h1 className="navbar-title-logo">
          <img src="/img/logo2.png" alt="Logo SG" className="navbar-logo-image" />
          <span className="navbar-title-text" style={{ color: user?.role === "admin" ? "#FFD700" : "#ffffff" }}>{user?.role === "admin" ? "Panel Admin" : "Servicio Técnico"}</span>
        </h1>
      </div>

      {/* 2. SECCIÓN CENTRAL: Enlace de Seguimiento Destacado (Centrado) */}
      {/* ¡SOLO SE MUESTRA si NO es admin! */}
      {(!user || user.role === 'user') && (
        <div className="navbar-section-center-tracking">
            <NavLink to="/seguimiento" className="tracking-oval-link">
                Seguimiento de Servicio
            </NavLink>
        </div>
      )}

      {/* 3. SECCIÓN DERECHA: Menú dinámico */}
      <ul className="navbar-links-right">
        {/* Visitante */}
        {!user && (
          <>
            <li><NavLink to="/" end>Inicio</NavLink></li>
            <li><NavLink to="/productos">Productos</NavLink></li>
            <li><NavLink to="/login">Login</NavLink></li>
            <li><NavLink to="/servicios">Ayuda</NavLink></li>
          </>
        )}

        {/* Usuario normal */}
        {user?.role === 'user' && (
          <>
            <li><NavLink to="/" end>Inicio</NavLink></li>
            <li><NavLink to="/productos">Productos</NavLink></li>
            <li><NavLink to="/carrito">Carrito</NavLink></li>
            <li><NavLink to="/servicios">Ayuda</NavLink></li>
            <li>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </li>
          </>
        )}

        {/* Admin */}
        {user?.role === 'admin' && (
          <>
            <li><NavLink to="/admin/paneltrabajos"><FaTools style={{ marginRight: '8px' }} />Panel de Trabajo</NavLink></li>
            <li><NavLink to="/admin/clientes">Clientes</NavLink></li>
            <li><NavLink to="/admin/productosAdmin">Productos</NavLink></li>
            <li><NavLink to="/admin/servicios">Servicios</NavLink></li>
            <li><NavLink to="/admin/estadisticas">Estadísticas</NavLink></li>
            <li><NavLink to="/admin/historial">Historial</NavLink></li>
            <li>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;