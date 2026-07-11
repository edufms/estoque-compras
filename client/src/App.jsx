import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { api } from "./api.js";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Produtos from "./pages/Produtos.jsx";
import Estoque from "./pages/Estoque.jsx";
import Listas from "./pages/Listas.jsx";
import Relatorios from "./pages/Relatorios.jsx";
import Categorias from "./pages/Categorias.jsx";
import Configuracoes from "./pages/Configuracoes.jsx";

const GRUPOS = [
  {
    nome: "Geral",
    itens: [{ label: "Início", path: "/", icone: "🏠" }],
  },
  {
    nome: "Gestão",
    itens: [
      { label: "Produtos", path: "/produtos", icone: "📦" },
      { label: "Estoque", path: "/estoque", icone: "📊" },
      { label: "Listas", path: "/listas", icone: "📝" },
    ],
  },
  {
    nome: "Dados",
    itens: [
      { label: "Relatórios", path: "/relatorios", icone: "📈" },
      { label: "Categorias", path: "/categorias", icone: "🏷️" },
    ],
  },
];

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [recolhido, setRecolhido] = useState(() => localStorage.getItem("sidebar") === "collapsed");
  const [tema, setTema] = useState(() => localStorage.getItem("tema") || "light");
  const [menuMobile, setMenuMobile] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem("tema", tema);
  }, [tema]);

  useEffect(() => {
    localStorage.setItem("sidebar", recolhido ? "collapsed" : "open");
  }, [recolhido]);

  function sair() {
    logout();
    navigate("/login");
  }

  function ativa(p) {
    if (p === "/") return location.pathname === "/";
    return location.pathname.startsWith(p);
  }

  return (
    <div className={`app sidebar-${recolhido ? "collapsed" : "open"}`}>
      <aside className="sidebar">
        <div className="sidebar-head">
          {!recolhido && <div className="brand">📦 Estoque &amp; Compras</div>}
          {recolhido && <div className="brand-mini">📦</div>}
          <button
            className="sidebar-toggle"
            aria-label="Alternar sidebar"
            onClick={() => setRecolhido((o) => !o)}
          >
            {recolhido ? "▶" : "◀"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {GRUPOS.map((g) => (
            <div key={g.nome} className="sidebar-grupo">
              {!recolhido && <div className="sidebar-grupo-label">{g.nome}</div>}
              {g.itens.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${ativa(item.path) ? "active" : ""}`}
                  onClick={() => setMenuMobile(false)}
                  title={recolhido ? item.label : undefined}
                >
                  <span className="sidebar-icone">{item.icone}</span>
                  {!recolhido && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-usuario">
            {usuario?.foto ? (
              <img src={usuario.foto} alt="" className="sidebar-avatar" />
            ) : (
              <div className="sidebar-avatar sidebar-avatar-text">{(usuario?.nome || "?")[0]}</div>
            )}
            {!recolhido && (
              <div className="sidebar-usuario-info">
                <div className="sidebar-usuario-nome">{usuario?.nome}</div>
                <div className="sidebar-usuario-role">{usuario?.role}</div>
              </div>
            )}
          </div>
          {!recolhido && (
            <div className="sidebar-acoes">
              <Link
                to="/configuracoes"
                className={`sidebar-link ${ativa("/configuracoes") ? "active" : ""}`}
              >
                <span className="sidebar-icone">⚙️</span>
                <span>Configurações</span>
              </Link>
              <button className="sidebar-link sidebar-btn" onClick={sair}>
                <span className="sidebar-icone">🚪</span>
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>

        {recolhido && (
          <div className="sidebar-footer-mini">
            <Link
              to="/configuracoes"
              className={`sidebar-link ${ativa("/configuracoes") ? "active" : ""}`}
              title="Configurações"
            >
              <span className="sidebar-icone">⚙️</span>
            </Link>
            <button className="sidebar-link sidebar-btn" onClick={sair} title="Sair">
              <span className="sidebar-icone">🚪</span>
            </button>
          </div>
        )}
      </aside>

      <div className="sidebar-overlay" onClick={() => setMenuMobile(false)} />

      <div className="app-main">
        <header className="topbar-mobile">
          <button className="menu-toggle" aria-label="Menu" onClick={() => setMenuMobile(true)}>
            ☰
          </button>
          <div className="brand">📦 Estoque &amp; Compras</div>
          <button
            className="theme-toggle"
            aria-label="Alternar tema"
            onClick={() => setTema((t) => (t === "dark" ? "light" : "dark"))}
          >
            {tema === "dark" ? "☀️" : "🌙"}
          </button>
        </header>
        <main className="content">{children}</main>
      </div>
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
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <Privado>
            <Home />
          </Privado>
        }
      />
      <Route
        path="/produtos"
        element={
          <Privado>
            <Produtos />
          </Privado>
        }
      />
      <Route
        path="/estoque"
        element={
          <Privado>
            <Estoque />
          </Privado>
        }
      />
      <Route
        path="/listas"
        element={
          <Privado>
            <Listas />
          </Privado>
        }
      />
      <Route
        path="/relatorios"
        element={
          <Privado>
            <Relatorios />
          </Privado>
        }
      />
      <Route
        path="/categorias"
        element={
          <Privado>
            <Categorias />
          </Privado>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <Privado>
            <Configuracoes />
          </Privado>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
