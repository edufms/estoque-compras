# AGENTS.md

Compact guidance for working in this repo. Commands are verified against `estoque-compras/backend/package.json`, `estoque-compras/backend/scripts/`, `estoque-compras/backend/jest.config.js`, and `estoque-compras/backend/src/config`.

## Layout & boundaries
- `estoque-compras/backend/` = **backend** (Node/Express/Sequelize, CommonJS). Entry: `src/server.js` (exports `start`), wiring in `src/app.js`, config in `src/config/index.js`, route controllers in `src/controllers`, models in `src/models`.
- `estoque-compras/client/` = **frontend** (React + Vite, ESM, `type: module`). Entry: `client/src/main.jsx`; routes/layout in `client/src/App.jsx`. Separate `package.json` and `node_modules` — treat as its own package.
- There is **no monorepo tooling**; run backend and frontend independently.

## Run commands
- Backend uses **PostgreSQL** (or SQLite as fallback). No MongoDB needed.
- Start: `cd estoque-compras/backend && node scripts/dev.js` (reads `DATABASE_URL` from `.env`; defaults to PostgreSQL).
- `node src/server.js` / `npm start` (run from `estoque-compras/backend`) also work as long as `DATABASE_URL` points at a running database.
- Frontend: `cd estoque-compras/client && npm install && npm run dev`. Vite dev server = port **5173** (uses **5174** if 5173 is taken). It proxies `/api` → `http://localhost:3000`, so the backend must be running for the UI to work. `--host` exposes it on the network.
- Build frontend: `cd estoque-compras/client && npm run build`.

## Tests
- `npm test` (run from `estoque-compras/backend`) runs Jest (`--runInBand --detectOpenHandles`). `jest.config.js` matches `tests/**/*.test.js` (e.g. `tests/app.test.js`).
- Tests use SQLite via Sequelize (`tests/setup.js` syncs the database and clears collections between tests). **No external database setup needed to test.**
- There is **no typecheck** configured (no TypeScript).
- **Lint** (`npm run lint`) and **format** (`npm run format` / `npm run format:check`) are available in both `backend/` and `client/`. Configs: `.eslintrc.json` + `.prettierrc` (root) + `.eslintignore` / `.prettierignore` per project.

## MongoDB / data persistence
- This environment has no standalone MongoDB. Dev runs use an **in-memory** SQLite (if `DATABASE_URL` is not postgres) or a PostgreSQL database.
- Backend reads config (port, database url, JWT) from `.env` via `dotenv` (`src/config/index.js`). `.env` is gitignored.

## Backend behavior worth knowing
- **Admin is locked to a single email**: `src/controllers/auth.controller.js` rejects `role: "admin"` unless `email === "edufms@gmail.com"`. The frontend hides the admin selector unless the email matches. Don't "fix" this as a bug.
- Product writes require `role: admin`; all non-auth routes require a `Bearer` token.
- Shopping-list item has a `precoUnitario` field; finalizing a list updates the product `preco` from `precoUnitario` (or the finalize modal `precos`).
- **Categories + icons are stored in the database** (`Category` model, endpoints `/api/categorias` list/create/delete, any authenticated user). `client/src/categorias.js` is the frontend helper: it fetches from the backend, keeps an in-memory cache (+ `localStorage` cache) and dispatches the `categorias-atualizadas` event. On first run with an empty backend it migrates any categories previously saved in the old `localStorage` key `estoque_categorias`. Product `categoria` is still a free string; `iconeDe(nome, lista)` resolves the icon by matching the category name.
- Manual list creation and inline list editing accept a product **by name**; an unknown name is auto-created (find-or-create in `resolverProduto`).

## Frontend behavior worth knowing
- **Categories and their icons are stored in the backend** (`Category` collection, `/api/categorias`) and shared across users/sessions — no longer `localStorage`-only. See the backend behavior note above for details. The category screen backfills from product categories already in use so you can assign icons to them.
- Product `categoria` is a free string; the icon is looked up by matching the category name (case-insensitive) against the localStorage list.
- Tables globally become card layouts on mobile (`max-width: 760px` in `styles.css`); the product "lista" view is a single grouped table with category header rows.
- `npm run build` is the only frontend verification step available.
