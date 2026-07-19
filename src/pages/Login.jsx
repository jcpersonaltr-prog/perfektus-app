import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signInWithPassword(email, password);
    setLoading(false);
    if (error) {
      setError("Email ou código de acesso incorretos.");
      return;
    }
    navigate("/");
  };

  return (
    <div className="screen login">
      <div className="login-body">
        <div className="eyebrow">Dossier do Atleta</div>
        <h1 className="title-serif">
          Acesso ao
          <br />
          Ficheiro
        </h1>

        <form onSubmit={handleSubmit}>
          <label className="field-label">Email</label>
          <input
            className="field-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="field-label">Código de Acesso</label>
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="error-text">{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>
      </div>
      <div className="login-footer">Fitness Uncovered — Sem Ruído. Sem Poses.</div>
    </div>
  );
}
