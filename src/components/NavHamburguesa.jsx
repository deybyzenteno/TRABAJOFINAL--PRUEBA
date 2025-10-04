import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    FaBars, FaTimes, FaHome, FaServicestack, FaSignInAlt, 
    FaShoppingCart, FaUsers, FaChartBar, FaHistory, FaTools // Añadimos FaTools para el icono de Seguimiento
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './NavHamburguesa.css';

function NavHamburguesa() {
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();

    let menuItems = [];

    if (!user) {
        menuItems = [
            { nombre: 'Inicio', to: '/', icon: <FaHome /> },
            { nombre: 'Productos', to: '/productos', icon: <FaShoppingCart /> },
            { nombre: 'Ayuda', to: '/servicios', icon: <FaServicestack /> },
            { nombre: 'Login', to: '/login', icon: <FaSignInAlt /> },
        ];
    } else if (user.role === 'user') {
        menuItems = [
            { nombre: 'Inicio', to: '/', icon: <FaHome /> },
            { nombre: 'Productos', to: '/productos', icon: <FaShoppingCart /> },
            { nombre: 'Carrito', to: '/carrito', icon: <FaShoppingCart /> },
            { nombre: 'Ayuda', to: '/servicios', icon: <FaServicestack /> },
        ];
    } else if (user.role === 'admin') {
        menuItems = [
            { nombre: 'Clientes', to: '/admin/clientes', icon: <FaUsers /> },
            { nombre: 'Productos', to: '/admin/productosAdmin', icon: <FaShoppingCart /> }, // Corregido: productosAdmin
            { nombre: 'Servicios', to: '/admin/servicios', icon: <FaServicestack /> },
            { nombre: 'Estadísticas', to: '/admin/estadisticas', icon: <FaChartBar /> },
            { nombre: 'Historial', to: '/admin/historial', icon: <FaHistory /> },
        ];
    }

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
                setOpen(false);
                Swal.fire(
                    'Sesión cerrada',
                    'Has cerrado sesión correctamente.',
                    'success'
                );
            }
        });
    };

    return (
        <>
            {/* Botón de menú hamburguesa */}
            <button 
                className={`nav-hamburguesa-btn${open ? ' active' : ''}`} 
                onClick={() => setOpen(true)}
            >
                <FaBars size={28} />
            </button>

            {/* Menú lateral */}
            <div className={`nav-hamburguesa-menu${open ? ' open' : ''}`}>
                <div className="nav-hamburguesa-header">
                    <span>Menú</span>
                    <button 
                        className="nav-hamburguesa-close" 
                        onClick={() => setOpen(false)}
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                <ul className="nav-hamburguesa-list">
                    {/* ENLACE DESTACADO: SEGUIMIENTO DE EQUIPO */}
                    <li className="nav-hamburguesa-tracking-item">
                        <Link 
                            to="/seguimiento" // Asegúrate de que esta ruta sea la de ConsultaServicio
                            className="nav-hamburguesa-tracking-cta" 
                            onClick={() => setOpen(false)}
                        >
                            <span className="tracking-icon"><FaTools size={20} /></span>
                            <div className="tracking-text-group">
                                <span className="tracking-title">Seguí el Estado de tu Equipo</span>
                                <span className="tracking-subtitle">Consulta por ID de servicio.</span>
                            </div>
                        </Link>
                    </li>
                    {/* FIN ENLACE DESTACADO */}


                    {menuItems.map(item => (
                        <li key={item.to}>
                            <Link 
                                to={item.to} 
                                className="nav-hamburguesa-link" 
                                onClick={() => setOpen(false)}
                            >
                                <span className="nav-hamburguesa-icon">{item.icon}</span>
                                {item.nombre}
                            </Link>
                        </li>
                    ))}

                    {user && (
                        <li>
                            <button 
                                className="nav-hamburguesa-link" 
                                onClick={handleLogout}
                            >
                                <FaSignInAlt /> Logout
                            </button>
                        </li>
                    )}
                </ul>
            </div>

            {/* Fondo oscuro cuando está abierto */}
            {open && <div className="nav-hamburguesa-overlay" onClick={() => setOpen(false)}></div>}
        </>
    );
}

export default NavHamburguesa;