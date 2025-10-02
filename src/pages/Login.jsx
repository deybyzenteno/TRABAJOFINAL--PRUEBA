import { useState } from "react";
import './Login.css';

function Login() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isRegister ? "Registrarse" : "Iniciar Sesión"}</h2>

        <form className="auth-form">
          {/* Campo usuario */}
          <input type="text" placeholder="Nombre de usuario" required />

          {/* Campo email solo si está registrando */}
          {isRegister && <input type="email" placeholder="Correo electrónico" required />}

          {/* Campo contraseña */}
          <input type="password" placeholder="Contraseña" required />

          {/* Confirmar contraseña solo si está registrando */}
          {isRegister && <input type="password" placeholder="Confirmar contraseña" required />}

          <button type="submit" className="auth-btn">
            {isRegister ? "Crear cuenta" : "Entrar"}
          </button>
        </form>

        <p className="toggle-text">
          {isRegister ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
          <span onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
