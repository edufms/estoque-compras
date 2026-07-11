const { Sequelize } = require("sequelize");
const path = require("path");

const SUPABASE_URL = "postgresql://postgres:Estoque%40123@db.vubcpoqirewqkvnqcxpx.supabase.co:5432/postgres";

async function run() {
  // 1. Connect to local DB and export data
  console.log("--- Conectando ao banco local ---");
  const localSeq = new Sequelize("postgresql://estoque:estoque123@localhost:5432/estoque-compras", {
    dialect: "postgres",
    logging: false,
  });
  await localSeq.authenticate();
  console.log("Local OK");

  const localModels = require("../src/models/index.js");
  // We need to use the localSeq instance with the models
  const MODELS = ["User", "Product", "Category", "ShoppingList", "Movement"];
  const data = {};
  for (const name of MODELS) {
    const Model = localModels[name];
    if (Model) {
      const rows = await localSeq.query(`SELECT * FROM "${Model.tableName || name}"`, {
        type: Sequelize.QueryTypes.SELECT,
      });
      data[name] = rows;
      console.log(`  ${name}: ${rows.length} registros`);
    }
  }
  await localSeq.close();

  // 2. Connect to Supabase and sync schema
  console.log("\n--- Conectando ao Supabase ---");
  const supabaseSeq = new Sequelize(SUPABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  });
  await supabaseSeq.authenticate();
  console.log("Supabase OK");

  // Override sequelize in models to use supabase connection
  const modelDir = path.join(__dirname, "..", "src", "models");
  delete require.cache[path.join(modelDir, "index.js")];
  delete require.cache[path.join(modelDir, "User.js")];
  delete require.cache[path.join(modelDir, "Product.js")];
  delete require.cache[path.join(modelDir, "Category.js")];
  delete require.cache[path.join(modelDir, "ShoppingList.js")];
  delete require.cache[path.join(modelDir, "Movement.js")];

  // Temporarily replace config/db to use supabase
  const dbModule = require("../src/config/db");
  const origConnect = dbModule.connectDB;

  // Force models to use supabaseSeq
  const User = require("../src/models/User");
  const Product = require("../src/models/Product");
  const Category = require("../src/models/Category");
  const ShoppingList = require("../src/models/ShoppingList");
  const Movement = require("../src/models/Movement");

  // Re-init models with supabase connection
  async function initModel(Model, seq) {
    // Sequelize models are already defined - we need to use the supabase connection
    // We'll use raw queries instead
  }

  // Sync schema via raw SQL
  console.log("\n--- Recriando schema no Supabase ---");

  // Drop all tables first (clean slate)
  const dropSQL = `
    DROP TABLE IF EXISTS "Movements" CASCADE;
    DROP TABLE IF EXISTS "ShoppingLists" CASCADE;
    DROP TABLE IF EXISTS "Products" CASCADE;
    DROP TABLE IF EXISTS "Users" CASCADE;
    DROP TABLE IF EXISTS "Categories" CASCADE;
    DROP TYPE IF EXISTS "enum_Users_role" CASCADE;
    DROP TYPE IF EXISTS "enum_ShoppingLists_status" CASCADE;
  `;
  await supabaseSeq.query(dropSQL);

  // Create tables matching schema
  const schemaSQL = `
    CREATE TYPE "enum_Users_role" AS ENUM ('admin', 'usuario');
    CREATE TYPE "enum_ShoppingLists_status" AS ENUM ('pendente', 'finalizada');

    CREATE TABLE IF NOT EXISTS "Users" (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      senha VARCHAR(255) NOT NULL,
      role "enum_Users_role" DEFAULT 'usuario',
      foto TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "Products" (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      descricao TEXT DEFAULT '',
      categoria VARCHAR(255) DEFAULT '',
      preco DOUBLE PRECISION DEFAULT 0,
      "precoCusto" DOUBLE PRECISION DEFAULT 0,
      quantidade DOUBLE PRECISION DEFAULT 0,
      "estoqueMinimo" DOUBLE PRECISION DEFAULT 0,
      validades JSONB DEFAULT '[]'::jsonb,
      "criadoPor" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "Categories" (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL UNIQUE,
      icone VARCHAR(10) DEFAULT '📦',
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "ShoppingLists" (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) DEFAULT '',
      status "enum_ShoppingLists_status" DEFAULT 'pendente',
      itens JSONB DEFAULT '[]'::jsonb,
      "criadoPor" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "Movements" (
      id SERIAL PRIMARY KEY,
      produto INTEGER REFERENCES "Products"(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      quantidade DOUBLE PRECISION NOT NULL,
      "precoUnitario" DOUBLE PRECISION,
      usuario INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
      observacao TEXT DEFAULT '',
      validades JSONB DEFAULT '[]'::jsonb,
      "listaId" INTEGER REFERENCES "ShoppingLists"(id) ON DELETE SET NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;
  await supabaseSeq.query(schemaSQL);
  console.log("Schema criado");

  // 3. Import data
  console.log("\n--- Importando dados ---");

  for (const name of MODELS) {
    const rows = data[name];
    if (!rows || rows.length === 0) {
      console.log(`  ${name}: sem dados`);
      continue;
    }
    const tableName = name === "ShoppingList" ? "ShoppingLists" : name + "s";
    // Actually need to check names:
    // User -> Users, Product -> Products, Category -> Categories
    // ShoppingList -> ShoppingLists, Movement -> Movements
    const finalTable = name === "Movement" ? "Movements" : name === "ShoppingList" ? "ShoppingLists" : name + "s";

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const cols = columns.map((c) => `"${c}"`).join(", ");

    for (const row of rows) {
      const values = columns.map((c) => {
        const v = row[c];
        if (v === null || v === undefined) return null;
        if (typeof v === "object") return JSON.stringify(v);
        return v;
      });
      // Reset sequence for id
      await supabaseSeq.query(
        `INSERT INTO "${finalTable}" (${cols}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        { bind: values }
      );
    }

    // Update sequence
    const maxId = Math.max(...rows.map((r) => r.id));
    await supabaseSeq.query(`SELECT setval('"${finalTable}_id_seq"', ${maxId}, true)`);
    console.log(`  ${finalTable}: ${rows.length} registros`);
  }

  await supabaseSeq.close();
  console.log("\nMigração concluída!");
}

run().catch((e) => {
  console.error("Erro:", e.message, e.stack);
  process.exit(1);
});