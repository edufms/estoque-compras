function normalizarData(valor) {
  if (!valor) return null;
  const v = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d));
    if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  }
  const dt = new Date(v);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return null;
}

function normalizarValidades(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((v) => {
      const bruta = v && v.data ? v.data : v ? v : null;
      const data = normalizarData(bruta);
      if (!data) return null;
      return {
        data,
        quantidade: Number(v.quantidade) || 0,
      };
    })
    .filter(Boolean);
}

function mesclarValidades(atuais, novas) {
  const map = new Map();
  for (const v of normalizarValidades(atuais)) {
    map.set(v.data, (map.get(v.data) || 0) + v.quantidade);
  }
  for (const v of normalizarValidades(novas)) {
    map.set(v.data, (map.get(v.data) || 0) + v.quantidade);
  }
  return Array.from(map.entries())
    .map(([data, quantidade]) => ({ data, quantidade }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

function subtrairValidades(atuais, menos) {
  const map = new Map();
  for (const v of normalizarValidades(atuais)) {
    map.set(v.data, (map.get(v.data) || 0) + v.quantidade);
  }
  for (const v of normalizarValidades(menos)) {
    map.set(v.data, (map.get(v.data) || 0) - v.quantidade);
  }
  return Array.from(map.entries())
    .filter(([, quantidade]) => quantidade > 0)
    .map(([data, quantidade]) => ({ data, quantidade }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

module.exports = { normalizarValidades, mesclarValidades, subtrairValidades };
