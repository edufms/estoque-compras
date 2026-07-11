const TOKEN_KEY = "estoque_token";

function store(persistent) {
  return persistent ? localStorage : sessionStorage;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token, persistent = true) {
  clearToken();
  store(persistent).setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const erro = (data && data.erro) || `Erro ${res.status}`;
    throw new Error(erro);
  }
  return data;
}

export const api = {
  login: (email, senha, lembrar = true) =>
    request("/auth/login", { method: "POST", body: { email, senha, lembrar }, auth: false }),
  cadastrar: (dados, lembrar = true) =>
    request("/auth/cadastrar", { method: "POST", body: { ...dados, lembrar }, auth: false }),
  perfil: () => request("/auth/perfil"),
  atualizarPerfil: (dados) => request("/auth/perfil", { method: "PUT", body: dados }),

  listarProdutos: (params = "") => request(`/produtos${params}`),
  obterProduto: (id) => request(`/produtos/${id}`),
  criarProduto: (dados) => request("/produtos", { method: "POST", body: dados }),
  atualizarProduto: (id, dados) => request(`/produtos/${id}`, { method: "PUT", body: dados }),
  removerProduto: (id) => request(`/produtos/${id}`, { method: "DELETE" }),
  importarProdutos: (itens) => request("/produtos/importar", { method: "POST", body: { itens } }),

  entrada: (id, dados) => request(`/estoque/${id}/entrada`, { method: "POST", body: dados }),
  saida: (id, dados) => request(`/estoque/${id}/saida`, { method: "POST", body: dados }),
  historico: (params = "") => request(`/estoque/historico${params}`),
  importarEstoque: (itens) => request("/estoque/importar", { method: "POST", body: { itens } }),

  listaAutomatica: () => request("/listas/automatica", { method: "POST" }),
  listaManual: (dados) => request("/listas/manual", { method: "POST", body: dados }),
  listarListas: (params = "") => request(`/listas${params}`),
  obterLista: (id) => request(`/listas/${id}`),
  marcarComprado: (id, produtoId, comprado) =>
    request(`/listas/${id}/marcar`, { method: "POST", body: { produtoId, comprado } }),
  finalizarLista: (id) => request(`/listas/${id}/finalizar`, { method: "POST", body: {} }),
  reabrirLista: (id) => request(`/listas/${id}/reabrir`, { method: "POST" }),
  removerLista: (id) => request(`/listas/${id}`, { method: "DELETE" }),
  atualizarLista: (id, dados) => request(`/listas/${id}`, { method: "PUT", body: dados }),

  relatorioEstoqueBaixo: (params = "") => request(`/relatorios/estoque-baixo${params}`),
  relatorioValorTotal: (params = "") => request(`/relatorios/valor-total${params}`),
  relatorioMaisMovimentados: (params = "") => request(`/relatorios/mais-movimentados${params}`),
  relatorioListasPendentes: (params = "") => request(`/relatorios/listas-pendentes${params}`),

  categorias: {
    listar: () => request("/categorias"),
    salvar: (nome, icone) => request("/categorias", { method: "POST", body: { nome, icone } }),
    remover: (nome) => request(`/categorias/${encodeURIComponent(nome)}`, { method: "DELETE" }),
  },
};
