import { NavLink } from 'react-router-dom';
import NavHamburguesa from './NavHamburguesa';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
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

  return (
    <nav className="navbar-sg">
      {/* Logo + Título */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="navbar-hamburguesa-container">
          <NavHamburguesa />
        </div>
        <h1 className="navbar-title-logo">
          <img src="/img/logo2.png" alt="Logo SG" className="navbar-logo-image" />
          <span className="navbar-title-text">Servicio Técnico</span>
        </h1>
      </div>

      {/* Menú derecho dinámico */}
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
            <li><NavLink to="/admin/clientes">Clientes</NavLink></li>
            <li><NavLink to="/admin/productosAdmin">Productos CRUD</NavLink></li>
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
