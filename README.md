# Controle de Estoque e Lista de Compras

Sistema completo de gestão de estoque com listas de compras automáticas/manuais, controle de validades, movimentações e relatórios.

## Stack

- **Backend:** Node.js, Express, Sequelize, PostgreSQL (via Supabase)
- **Frontend:** React, Vite, React Router DOM
- **Autenticação:** JWT com bcryptjs
- **Documentação:** Swagger (OpenAPI)

## Estrutura

```
estoque-compras/
├── backend/          # API REST (CommonJS)
│   ├── src/
│   │   ├── config/       # Conexão DB, Swagger
│   │   ├── controllers/  # Lógica das rotas
│   │   ├── middleware/    # Auth, error handler
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # Express routers
│   │   ├── utils/        # Helpers (validades, dialect)
│   │   ├── app.js        # Setup Express
│   │   └── server.js     # Entry point
│   ├── tests/            # Jest + Supertest
│   └── scripts/          # Dev, migração SQL
├── client/           # Frontend React (ESM)
│   └── src/
│       ├── pages/        # Home, Produtos, Estoque, Listas, etc.
│       ├── auth.jsx      # Context de autenticação
│       ├── api.js        # Cliente HTTP
│       └── App.jsx       # Layout + rotas
├── .prettierrc
└── migrar_supabase.sql   # Schema + dados para Supabase
```

## Como rodar

### Backend

```bash
cd backend
cp .env.example .env  # configure DATABASE_URL
npm install
npm run dev           # http://localhost:3000
```

### Frontend

```bash
cd client
npm install
npm run dev           # http://localhost:5173 (proxy /api → :3000)
```

O frontend faz proxy de `/api` para `localhost:3000`. Para acessar de outros dispositivos na rede:

```bash
npm run dev -- --host
```

## Scripts disponíveis

| Comando | Backend | Frontend |
|---------|---------|---------|
| `npm run dev` | Inicia servidor com dev.js | Vite dev server |
| `npm start` | `node src/server.js` | — |
| `npm test` | Jest (5 testes de integração) | — |
| `npm run build` | — | Vite build |
| `npm run lint` | ESLint (CommonJS) | ESLint (React/JSX) |
| `npm run format` | Prettier —write | Prettier —write |
| `npm run format:check` | Prettier —check | Prettier —check |

## Migração para Supabase

O arquivo `migrar_supabase.sql` contém o schema completo + dados exportados. Execute no SQL Editor do Supabase Dashboard.

Após a migração, use a string do **Session pooler** no `.env`:

```
DATABASE_URL=postgresql://postgres.SEU_PROJETO:[SENHA]@aws-1-us-west-2.pooler.supabase.com:5432/postgres
```

## API

Documentação interativa em `http://localhost:3000/api-docs` (Swagger).

### Autenticação

- `POST /api/auth/cadastrar` — criar conta
- `POST /api/auth/login` — login (retorna JWT)
- `GET /api/auth/perfil` — dados do usuário
- `PUT /api/auth/perfil` — atualizar nome/senha/foto

### Produtos

- `GET/POST /api/produtos` — listar / criar (admin)
- `PUT/DELETE /api/produtos/:id` — atualizar / remover (admin)

### Estoque

- `POST /api/estoque/:id/entrada` — adicionar quantidade + validades
- `POST /api/estoque/:id/saida` — consumir de lote específico
- `GET /api/estoque/historico` — movimentações
- `GET /api/estoque/exportar` — CSV

### Listas de Compras

- `POST /api/listas/automatica` — gerar a partir de produtos abaixo do mínimo
- `POST /api/listas/manual` — criar manualmente
- `GET/DELETE /api/listas` — listar / remover
- `POST /api/listas/:id/marcar` — marcar item como comprado
- `POST /api/listas/:id/finalizar` — finaliza e atualiza preços

### Relatórios

- `GET /api/relatorios/estoque-baixo`
- `GET /api/relatorios/valor-total`
- `GET /api/relatorios/mais-movimentados`
- `GET /api/relatorios/listas-pendentes`

## Admin

Apenas o email **edufms@gmail.com** pode ter `role: admin`. Usuários comuns podem gerenciar categorias e ver relatórios, mas não podem criar/editar/remover produtos.
