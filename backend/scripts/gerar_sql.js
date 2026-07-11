const { Sequelize } = require("sequelize");
const fs = require("fs");

async function run() {
  const seq = new Sequelize("postgresql://estoque:estoque123@localhost:5432/estoque-compras", {
    dialect: "postgres",
    logging: false,
  });
  await seq.authenticate();

  const tables = ["Users", "Products", "Categories", "ShoppingLists", "Movements"];
  const data = {};
  for (const t of tables) {
    const rows = await seq.query(`SELECT * FROM "${t}" ORDER BY id`, {
      type: Sequelize.QueryTypes.SELECT,
    });
    data[t] = rows;
  }
  await seq.close();

  let sql = "-- Schema + dados gerados em " + new Date().toISOString() + "\n";
  sql += "-- Execute no SQL Editor do Supabase ou via psql\n\n";
  sql += "BEGIN;\n\n";

  sql += 'DROP TABLE IF EXISTS "Movements" CASCADE;\n';
  sql += 'DROP TABLE IF EXISTS "ShoppingLists" CASCADE;\n';
  sql += 'DROP TABLE IF EXISTS "Products" CASCADE;\n';
  sql += 'DROP TABLE IF EXISTS "Users" CASCADE;\n';
  sql += 'DROP TABLE IF EXISTS "Categories" CASCADE;\n';
  sql += 'DROP TYPE IF EXISTS "enum_Users_role" CASCADE;\n';
  sql += 'DROP TYPE IF EXISTS "enum_ShoppingLists_status" CASCADE;\n\n';

  sql += `CREATE TYPE "enum_Users_role" AS ENUM ('admin', 'usuario');\n`;
  sql += `CREATE TYPE "enum_ShoppingLists_status" AS ENUM ('pendente', 'finalizada');\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS "Users" (\n`;
  sql += `  id SERIAL PRIMARY KEY,\n`;
  sql += `  nome VARCHAR(255) NOT NULL,\n`;
  sql += `  email VARCHAR(255) NOT NULL UNIQUE,\n`;
  sql += `  senha VARCHAR(255) NOT NULL,\n`;
  sql += `  role "enum_Users_role" DEFAULT 'usuario',\n`;
  sql += `  foto TEXT,\n`;
  sql += `  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),\n`;
  sql += `  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS "Products" (\n`;
  sql += `  id SERIAL PRIMARY KEY,\n`;
  sql += `  nome VARCHAR(255) NOT NULL,\n`;
  sql += `  descricao TEXT DEFAULT '',\n`;
  sql += `  categoria VARCHAR(255) DEFAULT '',\n`;
  sql += `  preco DOUBLE PRECISION DEFAULT 0,\n`;
  sql += `  "precoCusto" DOUBLE PRECISION DEFAULT 0,\n`;
  sql += `  quantidade DOUBLE PRECISION DEFAULT 0,\n`;
  sql += `  "estoqueMinimo" DOUBLE PRECISION DEFAULT 0,\n`;
  sql += `  validades JSONB DEFAULT '[]'::jsonb,\n`;
  sql += `  "criadoPor" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,\n`;
  sql += `  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),\n`;
  sql += `  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS "Categories" (\n`;
  sql += `  id SERIAL PRIMARY KEY,\n`;
  sql += `  nome VARCHAR(255) NOT NULL UNIQUE,\n`;
  sql += `  icone VARCHAR(10) DEFAULT '📦',\n`;
  sql += `  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),\n`;
  sql += `  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS "ShoppingLists" (\n`;
  sql += `  id SERIAL PRIMARY KEY,\n`;
  sql += `  nome VARCHAR(255) DEFAULT '',\n`;
  sql += `  status "enum_ShoppingLists_status" DEFAULT 'pendente',\n`;
  sql += `  itens JSONB DEFAULT '[]'::jsonb,\n`;
  sql += `  "criadoPor" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,\n`;
  sql += `  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),\n`;
  sql += `  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS "Movements" (\n`;
  sql += `  id SERIAL PRIMARY KEY,\n`;
  sql += `  produto INTEGER REFERENCES "Products"(id) ON DELETE CASCADE,\n`;
  sql += `  tipo VARCHAR(50) NOT NULL,\n`;
  sql += `  quantidade DOUBLE PRECISION NOT NULL,\n`;
  sql += `  "precoUnitario" DOUBLE PRECISION,\n`;
  sql += `  usuario INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,\n`;
  sql += `  observacao TEXT DEFAULT '',\n`;
  sql += `  validades JSONB DEFAULT '[]'::jsonb,\n`;
  sql += `  "listaId" INTEGER REFERENCES "ShoppingLists"(id) ON DELETE SET NULL,\n`;
  sql += `  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),\n`;
  sql += `  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()\n`;
  sql += `);\n\n`;

  function esc(val, colName) {
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "object") return "'" + JSON.stringify(val).replace(/'/g, "''") + "'";
    if (typeof val === "string") {
      if (val === "") {
        if (colName && (colName.endsWith("At") || colName.endsWith("date"))) return "NOW()";
        return "''";
      }
      return "'" + val.replace(/'/g, "''") + "'";
    }
    return String(val);
  }

  for (const t of tables) {
    const rows = data[t];
    if (!rows || rows.length === 0) continue;
    for (const row of rows) {
      const cols = Object.keys(row);
      const cnames = cols.map((c) => '"' + c + '"').join(", ");
      const vals = cols.map((c) => esc(row[c], c)).join(", ");
      sql += 'INSERT INTO "' + t + '" (' + cnames + ") VALUES (" + vals + ");\n";
    }
    const maxId = Math.max(...rows.map((r) => r.id));
    sql += 'SELECT setval(\'"' + t + '_id_seq"\', ' + maxId + ", true);\n\n";
  }

  sql += "COMMIT;\n";

  fs.writeFileSync("/tmp/migrar_supabase.sql", sql, "utf8");
  console.log("SQL gerado: /tmp/migrar_supabase.sql");
  console.log("Tamanho: " + (Buffer.byteLength(sql, "utf8") / 1024).toFixed(1) + " KB");
  console.log("\nRegistros exportados:");
  for (const t of tables) {
    console.log("  " + t + ": " + (data[t]?.length || 0));
  }
}

run().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});