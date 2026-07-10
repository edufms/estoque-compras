import { api } from "./api.js";

const LEGADO = "estoque_categorias";
const CACHE = "estoque_categorias_cache";

let cache = [];

export async function carregarCategorias() {
  let cats = [];
  try {
    cats = await api.categorias.listar();
  } catch {
    cats = [];
  }

  // Migração única: se o backend está vazio mas havia dados no localStorage antigo
  if (cats.length === 0) {
    try {
      const legado = JSON.parse(localStorage.getItem(LEGADO) || "[]");
      if (Array.isArray(legado) && legado.length) {
        for (const c of legado) {
          try {
            await api.categorias.salvar(c.nome, c.icone);
          } catch {
            /* ignora */
          }
        }
        localStorage.removeItem(LEGADO);
        cats = await api.categorias.listar();
      }
    } catch {
      /* ignora */
    }
  }

  cache = Array.isArray(cats) ? cats : [];
  try {
    localStorage.setItem(CACHE, JSON.stringify(cache));
  } catch {
    /* ignora */
  }
  window.dispatchEvent(new Event("categorias-atualizadas"));
  return cache;
}

export function getCategorias() {
  if (cache.length) return cache;
  try {
    return JSON.parse(localStorage.getItem(CACHE)) || [];
  } catch {
    return [];
  }
}

export async function salvarCategoria(nome, icone) {
  await api.categorias.salvar(nome, icone);
  return carregarCategorias();
}

export async function removerCategoria(nome) {
  await api.categorias.remover(nome);
  return carregarCategorias();
}

export function iconeDe(nome, lista) {
  const fonte = lista && lista.length ? lista : cache;
  const c = fonte.find((x) => x.nome.toLowerCase() === String(nome || "").toLowerCase());
  return c ? c.icone : "";
}
