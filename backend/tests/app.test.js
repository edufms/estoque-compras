const request = require("supertest");
const criarApp = require("../src/app");
const { User, Product } = require("../src/models");

const app = criarApp();

describe("Auth", () => {
  it("cadastra e faz login de um usuário", async () => {
    const res = await request(app).post("/api/auth/cadastrar").send({
      nome: "Ana",
      email: "ana@teste.com",
      senha: "123456",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();

    const login = await request(app).post("/api/auth/login").send({
      email: "ana@teste.com",
      senha: "123456",
    });
    expect(login.statusCode).toBe(200);
    expect(login.body.token).toBeDefined();
  });

  it("bloqueia rota protegida sem token", async () => {
    const res = await request(app).get("/api/produtos");
    expect(res.statusCode).toBe(401);
  });
});

describe("Produtos e Estoque", () => {
  let token;
  beforeEach(async () => {
    const res = await request(app).post("/api/auth/cadastrar").send({
      nome: "Admin",
      email: "edufms@gmail.com",
      senha: "123456",
      role: "admin",
    });
    token = res.body.token;
  });

  it("cria, dá entrada e saída de produto", async () => {
    const prod = await request(app)
      .post("/api/produtos")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Café", categoria: "Bebidas", preco: 5, quantidade: 0, estoqueMinimo: 3 });
    expect(prod.statusCode).toBe(201);

    const id = prod.body.id;
    const entrada = await request(app)
      .post(`/api/estoque/${id}/entrada`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantidade: 10 });
    expect(entrada.body.produto.quantidade).toBe(10);

    const saida = await request(app)
      .post(`/api/estoque/${id}/saida`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantidade: 8 });
    expect(saida.body.produto.quantidade).toBe(2);
    expect(saida.body.alertaBaixoEstoque).toBe(true);
  });

  it("relatório de estoque baixo detecta produto", async () => {
    await request(app)
      .post("/api/produtos")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Açúcar", categoria: "Mercearia", preco: 4, quantidade: 1, estoqueMinimo: 5 });

    const rel = await request(app)
      .get("/api/relatorios/estoque-baixo")
      .set("Authorization", `Bearer ${token}`);
    expect(rel.body.length).toBe(1);
  });
});

describe("Lista de Compras", () => {
  let token;
  let prodId;
  beforeEach(async () => {
    const res = await request(app).post("/api/auth/cadastrar").send({
      nome: "User",
      email: "edufms@gmail.com",
      senha: "123456",
      role: "admin",
    });
    token = res.body.token;
    const prod = await request(app)
      .post("/api/produtos")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Arroz", categoria: "Mercearia", preco: 20, quantidade: 1, estoqueMinimo: 10 });
    prodId = prod.body.id;
  });

  it("cria lista automática para produto abaixo do mínimo e finaliza", async () => {
    const auto = await request(app)
      .post("/api/listas/automatica")
      .set("Authorization", `Bearer ${token}`);
    expect(auto.statusCode).toBe(201);

    const listaId = auto.body.id;
    const antes = (await Product.findByPk(prodId)).quantidade;
    const fim = await request(app)
      .post(`/api/listas/${listaId}/finalizar`)
      .set("Authorization", `Bearer ${token}`);
    expect(fim.body.status).toBe("finalizada");

    const depois = (await Product.findByPk(prodId)).quantidade;
    expect(depois).toBeGreaterThan(antes);
  });
});
