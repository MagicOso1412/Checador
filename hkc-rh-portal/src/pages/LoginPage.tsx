import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { token, cargando, error, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await iniciarSesion(email, password);
      navigate("/", { replace: true });
    } catch {
      // el error ya queda en el estado del contexto, se muestra abajo
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>HKC Attendance</h1>
        <p className="subtitle">Portal de Recursos Humanos</p>

        <label htmlFor="email">Correo</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" disabled={cargando}>
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
