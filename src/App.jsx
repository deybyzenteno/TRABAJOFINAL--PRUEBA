import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Páginas públicas
import Home from "./pages/Home";
import Productos from "./pages/Productos";
import Servicios from "./pages/Servicios";
import Login from "./pages/Login";
import Carrito from "./pages/Carrito";
import NotFound from "./pages/NotFound";

// Panel Admin
import ClientesAdmin from "./admin/ClientesAdmin";
import ProductosAdmin from "./admin/ProductosAdmin";
import ServiciosAdmin from "./admin/ServiciosAdmin";
import EstadisticasAdmin from "./admin/EstadisticasAdmin";
import HistorialAdmin from "./admin/HistorialAdmin";

import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/login" element={<Login />} />
          <Route path="/servicios" element={<Servicios />} />

          {/* Rutas privadas para usuarios normales */}
          <Route
            path="/carrito"
            element={
              <PrivateRoute role="user">
                <Carrito />
              </PrivateRoute>
            }
          />

          {/* Rutas privadas para ADMIN */}
          <Route
            path="/admin/clientes"
            element={
              <PrivateRoute role="admin">
                <ClientesAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/productos"
            element={
              <PrivateRoute role="admin">
                <ProductosAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/servicios"
            element={
              <PrivateRoute role="admin">
                <ServiciosAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/estadisticas"
            element={
              <PrivateRoute role="admin">
                <EstadisticasAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/historial"
            element={
              <PrivateRoute role="admin">
                <HistorialAdmin />
              </PrivateRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
