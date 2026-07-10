import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { api } from "./api.js";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Produtos from "./pages/Produtos.jsx";
import Estoque from "./pages/Estoque.jsx";
import Listas from "./pages/Listas.jsx";
import Relatorios from "./pages/Relatorios.jsx";
import Categorias from "./pages/Categorias.jsx";

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem("tema") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem("tema", tema);
  }, [tema]);

  function sair() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="menu-toggle"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            ☰
          </button>
          <div className="brand">📦 Estoque &amp; Compras</div>
        </div>
        <nav className={`menu ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Início</Link>
          <Link to="/produtos" onClick={() => setMenuOpen(false)}>Produtos</Link>
          <Link to="/estoque" onClick={() => setMenuOpen(false)}>Estoque</Link>
          <Link to="/listas" onClick={() => setMenuOpen(false)}>Listas</Link>
          <Link to="/relatorios" onClick={() => setMenuOpen(false)}>Relatórios</Link>
          <Link to="/categorias" onClick={() => setMenuOpen(false)}>Categorias</Link>
        </nav>
        <div className="user">
          <button
            className="theme-toggle"
            aria-label="Alternar tema"
            onClick={() => setTema((t) => (t === "dark" ? "light" : "dark"))}
          >
            {tema === "dark" ? "☀️" : "🌙"}
          </button>
          <span>{usuario?.nome} ({usuario?.role})</span>
          <button onClick={sair}>Sair</button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

function Privado({ children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <p className="center">Carregando…</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <p className="center">Carregando…</p>;
  return (
    <Routes>
      <Route
        path="/login"
        element={usuario ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/" element={<Privado><Home /></Privado>} />
      <Route path="/produtos" element={<Privado><Produtos /></Privado>} />
      <Route path="/estoque" element={<Privado><Estoque /></Privado>} />
      <Route path="/listas" element={<Privado><Listas /></Privado>} />
      <Route path="/relatorios" element={<Privado><Relatorios /></Privado>} />
      <Route path="/categorias" element={<Privado><Categorias /></Privado>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
