# Sistema de Controle de Estoque e Lista de Compras

MVP em Node.js (Express + MongoDB) com controle de estoque, listas de compras automáticas/manuais, relatórios e autenticação JWT.

## Tecnologias
Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Swagger, Jest.

## Como rodar
1. Instale o MongoDB e crie um banco.
2. Configure o `.env` (veja `.env.example`).
3. `npm install`
4. `npm run dev` (ou `npm start`)

Servidor em `http://localhost:3000`. Swagger em `http://localhost:3000/api-docs`.

## Testes
`npm test` (usa MongoDB em memória, não precisa de instância externa).

## Endpoints principais
- `POST /api/auth/cadastrar` · `POST /api/auth/login` · `GET /api/auth/perfil`
- `GET/POST/PUT/DELETE /api/produtos`
- `POST /api/estoque/:id/entrada` · `POST /api/estoque/:id/saida` · `GET /api/estoque/historico`
- `POST /api/listas/automatica` · `POST /api/listas/manual` · `GET/DELETE /api/listas` · `POST /api/listas/:id/marcar` · `POST /api/listas/:id/finalizar`
- `GET /api/relatorios/estoque-baixo` · `valor-total` · `mais-movimentados` · `listas-pendentes`

Rotas de escrita de produto exigem `role: admin`. Todas as rotas (exceto auth) exigem header `Authorization: Bearer <token>`.
