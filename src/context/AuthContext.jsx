import { createContext, useContext, useState } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // LOGIN
  const login = async (username, password) => {
    try {
      const res = await fetch(`http://localhost:3001/Usuarios?username=${username}`);
      const data = await res.json();

      if (data.length === 0) return { ok: false, message: "Usuario no encontrado" };

      const found = data[0];
      if (found.password !== password) return { ok: false, message: "Contraseña incorrecta" };

      setUser({ username: found.username, role: found.role });
      return { ok: true, user: found };
    } catch (err) {
      return { ok: false, message: "Error de conexión" };
    }
  };

  // REGISTRO
  const register = async (username, password) => {
    try {
      const resCheck = await fetch(`http://localhost:3001/Usuarios?username=${username}`);
      const dataCheck = await resCheck.json();
      if (dataCheck.length > 0) return { ok: false, message: "Usuario ya existe" };

      const newUser = { username, password, role: "user" };
      const res = await fetch(`http://localhost:3001/Usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();

      setUser({ username: data.username, role: data.role });
      return { ok: true, user: data };
    } catch (err) {
      return { ok: false, message: "Error de conexión" };
    }
  };

  // LOGOUT
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
