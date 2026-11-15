# ShopCar API

API REST para gerenciamento de **locação de veículos**, desenvolvida em **Node.js + Express 5** com **Prisma ORM** sobre **MySQL/MariaDB**. O sistema permite cadastrar usuários, autenticar via **JWT**, cadastrar veículos e controlar o ciclo de vida das locações (criação, consulta e finalização), com reserva automática do veículo no momento da locação.

Projeto desenvolvido na disciplina de **Programação com Frameworks Web** (4º período - [Unipê](https://www.unipe.edu.br))

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack de tecnologias](#stack-de-tecnologias)
- [Arquitetura](#arquitetura)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Modelo de dados](#modelo-de-dados)
- [Configuração e execução](#configuração-e-execução)
- [Autenticação](#autenticação)
- [Padrões da API](#padrões-da-api)
  - [Formato de sucesso](#formato-de-sucesso)
  - [Formato de erro](#formato-de-erro)
  - [Paginação](#paginação)
  - [Códigos de status utilizados](#códigos-de-status-utilizados)
- [Endpoints](#endpoints)
  - [Autenticação](#autenticação-1)
  - [Usuários](#usuários)
  - [Veículos](#veículos)
  - [Locações](#locações)
- [Regras de negócio](#regras-de-negócio)
- [Fluxo completo de exemplo](#fluxo-completo-de-exemplo)
- [Limitações e observações](#limitações-e-observações)

---

## Visão geral

A API expõe recursos para:

| Recurso | Descrição |
| --- | --- |
| **Autenticação** | Login com e-mail e senha. |
| **Usuários** | Cadastro público e CRUD protegido (listagem paginada, busca por ID, atualização e exclusão). |
| **Veículos** | Cadastro (protegido) e listagem paginada com filtro por disponibilidade. |
| **Locações** | Criação vinculada ao usuário autenticado, listagem, consulta por ID e finalização com devolução do veículo. |

Principais características:

- Validação de payloads com **Zod**.
- Middleware centralizado de tratamento de erros.
- Paginação em todas as listagens.
- Cálculo automático do valor total da locação com base nas diárias.
- Controle de concorrência na reserva do veículo usando transações do Prisma.
- Isolamento de dados: um usuário só enxerga e finaliza as **suas próprias** locações.

> **Importante:** as rotas são montadas diretamente na raiz do servidor, **sem prefixo** como `/api` ou `/v1`. A URL base local é `http://localhost:3000`.

---

## Stack de tecnologias

| Tecnologia | Versão (package.json) | Papel |
| --- | --- | --- |
| Node.js | — | Runtime JavaScript |
| Express | `^5.3.0` | Framework HTTP e roteamento |
| Prisma Client | `^7.9.1` | ORM / acesso ao banco |
| Prisma CLI | `^7.9.1` (dev) | Migrations e geração do client |
| `@prisma/adapter-mariadb` | `^7.10.1` | Driver adapter MariaDB/MySQL |
| bcrypt | `^6.0.0` | Hash de senhas |
| jsonwebtoken | `^9.0.3` | Geração e validação de JWT (HS256) |
| zod | `^4.6.7` | Validação de schemas |
| dotenv | `^18.0.9` | Carregamento de variáveis de ambiente |
| nodemon | `^3.1.14` (dev) | Hot reload em desenvolvimento |

---

## Arquitetura

O projeto segue uma arquitetura em camadas, com responsabilidades bem separadas:

```
Requisição HTTP
      │
      ▼
┌──────────────┐
│   Routes     │  Define métodos, caminhos e ordem dos middlewares
└──────┬───────┘
       ▼
┌──────────────┐
│ Middlewares  │  authMiddleware (JWT) → validateMiddleware (Zod)
└──────┬───────┘
       ▼
┌──────────────┐
│ Controllers  │  Extrai dados de req (body, params, query, user)
│              │  Chama o service e devolve a resposta HTTP
└──────┬───────┘
       ▼
┌──────────────┐
│   Services   │  Regras de negócio, validações de domínio,
│              │  transações e acesso ao banco via Prisma
└──────┬───────┘
       ▼
┌──────────────┐
│   Prisma     │  MySQL/MariaDB
└──────────────┘
```

**Tratamento de erros:** services lançam `ApiError(message, statusCode)` para erros esperados. O `errorMiddleware` (registrado por último no Express) converte `ApiError` em `{ error }`, `ZodError` em `{ error, details }` e qualquer erro inesperado em `500 { error: "Erro interno do servidor." }`.

---

## Estrutura de diretórios

```
shopcar/
├── prisma/
│   ├── schema.prisma              # Modelos, enum e datasource
│   ├── migrations/                # Histórico de migrations SQL
│   │   ├── 20261031175851_create_user/
│   │   ├── 20261031180629_create_vehicle/
│   │   └── 20261031210533_create_rental/
│   └── migration_lock.toml
├── prisma.config.js               # Configuração do Prisma CLI (schema + datasource)
├── src/
│   ├── index.js                   # Bootstrap do Express e montagem das rotas
│   ├── databases/
│   │   └── prisma.js              # Instância única do PrismaClient com adapter MariaDB
│   ├── routes/
│   │   ├── authRoutes.js          # POST /login
│   │   ├── usuarioRoutes.js       # /usuarios
│   │   ├── veiculoRoutes.js       # /veiculos
│   │   └── locacaoRoutes.js       # /locacoes
│   ├── controllers/
│   │   ├── AuthController.js
│   │   ├── UsuarioController.js
│   │   ├── VeiculoController.js
│   │   └── LocacaoController.js
│   ├── services/
│   │   ├── AuthService.js
│   │   ├── UsuarioService.js
│   │   ├── VeiculoService.js
│   │   └── LocacaoService.js
│   ├── schemas/
│   │   ├── usuarioSchema.js       # usuarioCreateSchema, usuarioUpdateSchema
│   │   ├── veiculoSchema.js       # veiculoCreateSchema
│   │   └── locacaoSchema.js       # locacaoCreateSchema
│   ├── middlewares/
│   │   ├── authMiddleware.js      # Valida o Bearer token
│   │   ├── validateMiddleware.js  # Valida req.body com Zod
│   │   └── errorMiddleware.js     # Tratamento centralizado de erros
│   └── utils/
│       ├── jwt.js                 # gerarToken / validarToken
│       ├── functions.js           # calcularValorTotal
│       └── error.js               # Classe ApiError
├── .env-example                   # Modelo de variáveis de ambiente
├── package.json
└── README.md
```

---

## Modelo de dados

### Diagrama de entidades

```
┌────────────────────┐          ┌────────────────────┐
│      Usuario       │          │      Veiculo       │
├────────────────────┤          ├────────────────────┤
│ id (PK)            │          │ id (PK)            │
│ nome               │          │ marca              │
│ email (UNIQUE)     │          │ modelo             │
│ senha (hash)       │          │ placa (UNIQUE)     │
│ dataCadastro       │          │ ano                │
└─────────┬──────────┘          │ valorDiaria        │
          │                     │ disponivel         │
          │ 1                 N └─────────┬──────────┘
          │                               │ 1
          │                               │
          │            ┌──────────────────┴─────┐
          └───────────►│        Locacao         │◄───────────┘
                     N ├────────────────────────┤
                       │ id (PK)                │
                       │ usuarioId (FK)         │
                       │ veiculoId (FK)         │
                       │ dataInicio             │
                       │ dataPrevistaDevolucao  │
                       │ dataDevolucao (NULL)   │
                       │ valorTotal             │
                       │ status (ATIVA|FINALIZADA) │
                       └────────────────────────┘
```

### `Usuario`

| Campo | Tipo | Restrições | Observações |
| --- | --- | --- | --- |
| `id` | `Int` | PK, autoincremento | |
| `nome` | `String` | obrigatório, mín. 3 caracteres | validado via Zod |
| `email` | `String` | obrigatório, **único**, formato de e-mail | validado via Zod |
| `senha` | `String` | obrigatório, mín. 6 caracteres | armazenada como hash bcrypt |
| `dataCadastro` | `DateTime` | default `now()` | |

### `Veiculo`

| Campo | Tipo | Restrições | Observações |
| --- | --- | --- | --- |
| `id` | `Int` | PK, autoincremento | |
| `marca` | `String` | obrigatório | sofre `trim()` |
| `modelo` | `String` | obrigatório | sofre `trim()` |
| `placa` | `String` | obrigatório, **único** | `trim()` + `toUpperCase()` |
| `ano` | `Int` | obrigatório, inteiro | |
| `valorDiaria` | `Decimal(10,2)` | obrigatório, positivo | |
| `disponivel` | `Boolean` | default `true` | controlado pelas locações |

### `Locacao`

| Campo | Tipo | Restrições | Observações |
| --- | --- | --- | --- |
| `id` | `Int` | PK, autoincremento | |
| `usuarioId` | `Int` | FK → `Usuario.id`, `ON DELETE RESTRICT` | vem do token JWT |
| `veiculoId` | `Int` | FK → `Veiculo.id`, `ON DELETE RESTRICT` | |
| `dataInicio` | `DateTime` | obrigatório | |
| `dataPrevistaDevolucao` | `DateTime` | obrigatório, > `dataInicio` | |
| `dataDevolucao` | `DateTime?` | opcional | preenchido ao finalizar |
| `valorTotal` | `Decimal(10,2)` | obrigatório | calculado na criação |
| `status` | `StatusLocacao` | default `ATIVA` | `ATIVA` ou `FINALIZADA` |

**Enum `StatusLocacao`:** `ATIVA`, `FINALIZADA`.

> **Serialização JSON:** campos `DateTime` são retornados em formato ISO 8601 (ex.: `"2026-11-02T12:00:00.000Z"`) e campos `Decimal` são serializados como **string** (ex.: `"150.00"`), comportamento padrão do Prisma.

---

## Configuração e execução

### 1. Pré-requisitos

- Node.js 18+ (recomendado 20+)
- MySQL 8+ ou MariaDB 10.5+

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env-example .env
```

`.env-example`:

```env
DATABASE_URL="mysql://<user>:<password>@localhost:3306/shopcar"

DB_HOST=localhost
DB_USER=
DB_PASSWORD=
DB_NAME=shopcar

PORT=

JWT_SECRET=
```

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Usada **apenas pela Prisma CLI** (migrations) em `prisma.config.js`. |
| `DB_HOST` | Host do banco usado pelo **driver adapter** em runtime. |
| `DB_USER` | Usuário do banco. |
| `DB_PASSWORD` | Senha do banco. |
| `DB_NAME` | Nome do banco (ex.: `shopcar`). |
| `PORT` | Porta do servidor Express (default `3000`). |
| `JWT_SECRET` | Segredo usado para assinar/validar os tokens JWT. |

> O runtime **não** usa `DATABASE_URL`: ele usa `DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` através do `PrismaMariaDb`. Por isso as duas formas de configuração precisam estar corretas.

### 4. Criar o banco e aplicar as migrations

Crie o banco no MySQL/MariaDB (ex.: `CREATE DATABASE shopcar;`) e rode:

```bash
npx prisma migrate deploy   # aplica migrations existentes
# ou, em desenvolvimento:
npx prisma migrate dev
```

Gere o client (necessário após instalar ou alterar o schema):

```bash
npx prisma generate
```

### 5. Iniciar o servidor

```bash
npm run dev
```

Saída esperada:

```
Servidor rodando em: http://localhost:3000
```


## Autenticação

A autenticação é baseada em **JWT (HS256)**.

1. O usuário se cadastra em `POST /usuarios`.
2. Faz login em `POST /login` e recebe um `token`.
3. Envia o token nas rotas protegidas no header:

```http
Authorization: Bearer <token>
```

**Características do token:**

- Payload: `{ id, nome, email }`
- `sub` (subject): o `id` do usuário em string
- Algoritmo: `HS256`
- Expiração: **1 hora**
- Assinatura com `JWT_SECRET`

**Regras do `authMiddleware`:**

| Situação | Status | Resposta |
| --- | --- | --- |
| Header `Authorization` ausente | `401` | `{ "error": "Token não informado." }` |
| Formato diferente de `Bearer <token>` (ou com partes extras) | `401` | `{ "error": "Token inválido." }` |
| Token inválido, adulterado ou expirado | `401` | `{ "error": "Token inválido ou expirado." }` |
| Token válido | — | Popula `req.user = { id, nome, email }` e segue |

**Rotas protegidas:** todas de `/usuarios` exceto o cadastro (`POST /usuarios`), todas de `/veiculos` e todas de `/locacoes`.

---

## Padrões da API

### Formato de sucesso

A maioria dos endpoints retorna o recurso **diretamente** no corpo (sem envelope `data`), com exceção de `POST /login`, que retorna `{ "data": { ... } }`, e das listagens, que retornam `{ "data": [...], "pagination": {...} }`.

### Formato de erro

Erros de domínio (`ApiError`):

```json
{
  "error": "Mensagem descritiva do erro."
}
```

Erros de validação (Zod):

```json
{
  "error": "Erro de validação nos dados enviados.",
  "details": [
    { "campo": "email", "message": "E-mail inválido." }
  ]
}
```

Erros inesperados:

```json
{
  "error": "Erro interno do servidor."
}
```

### Paginação

Listagens aceitam os query params `page` (default `1`) e `per` (default `10`) e retornam:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "per": 10,
    "total": 42,
    "totalOfPages": 5
  }
}
```

### Códigos de status utilizados

| Código | Quando ocorre |
| --- | --- |
| `200 OK` | Consultas, login e atualizações bem-sucedidas. |
| `201 Created` | Criação de usuário, veículo ou locação. |
| `204 No Content` | Exclusão de usuário. |
| `400 Bad Request` | Payload inválido, parâmetro de query inválido ou regra de negócio violada. |
| `401 Unauthorized` | Credenciais inválidas ou token ausente/inválido/expirado. |
| `404 Not Found` | Recurso inexistente (ou locação de outro usuário). |
| `409 Conflict` | Veículo indisponível ou locação já finalizada. |
| `500 Internal Server Error` | Erro não tratado (ex.: falha de FK, parâmetro numérico inválido não previsto). |

---

## Endpoints

### Autenticação

#### `POST /login`

Autentica um usuário e retorna um token JWT.

- **Autenticação:** não
- **Body:**

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `email` | `string` | sim | E-mail cadastrado. |
| `senha` | `string` | sim | Senha em texto plano. |

**Requisição:**

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ana@email.com", "senha": "123456"}'
```

**Resposta `200`:**

```json
{
  "data": {
    "id": 1,
    "nome": "Ana Silva",
    "email": "ana@email.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Erros:**

| Status | Mensagem |
| --- | --- |
| `401` | `E-mail ou senha inválidos.` (e-mail inexistente ou senha incorreta) |

> O body de login **não** passa por validação Zod. Campos ausentes resultam em falha de autenticação (`401`).

---

### Usuários

#### `POST /usuarios`

Cadastra um novo usuário. **Rota pública.**

- **Autenticação:** não
- **Body:**

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `nome` | `string` | sim | `trim`, mínimo 3 caracteres. |
| `email` | `string` | sim | `trim`, formato válido, único. |
| `senha` | `string` | sim | mínimo 6 caracteres. |

**Requisição:**

```bash
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Ana Silva",
    "email": "ana@email.com",
    "senha": "123456"
  }'
```

**Resposta `201`:**

```json
{
  "id": 1,
  "nome": "Ana Silva",
  "email": "ana@email.com",
  "dataCadastro": "2026-11-02T12:00:00.000Z"
}
```

**Erros:**

| Status | Mensagem |
| --- | --- |
| `400` | `E-mail já cadastrado no sistema.` |
| `400` | `Erro de validação nos dados enviados.` + `details` |

---

#### `GET /usuarios`

Lista usuários com paginação e ordenação.

- **Autenticação:** Bearer token
- **Query params:**

| Param | Default | Valores aceitos | Descrição |
| --- | --- | --- | --- |
| `page` | `1` | inteiro ≥ 1 | Página atual. |
| `per` | `10` | inteiro ≥ 1 | Itens por página. |
| `orderBy` | `id` | `id`, `nome`, `email`, `dataCadastro` | Campo de ordenação. |
| `order` | `desc` | `asc`, `desc` | Direção da ordenação. |

**Requisição:**

```bash
curl "http://localhost:3000/usuarios?page=1&per=10&orderBy=nome&order=asc" \
  -H "Authorization: Bearer <token>"
```

**Resposta `200`:**

```json
{
  "data": [
    { "id": 1, "nome": "Ana Silva", "email": "ana@email.com" }
  ],
  "pagination": {
    "page": 1,
    "per": 10,
    "total": 1,
    "totalOfPages": 1
  }
}
```

**Erros:**

| Status | Mensagem |
| --- | --- |
| `400` | `O parâmetro 'order' deve ser 'asc' ou 'desc'.` |
| `400` | `O parâmetro 'orderBy' deve ser 'id', 'nome', 'email' ou 'dataCadastro'.` |
| `401` | Token ausente/inválido. |

---

#### `GET /usuarios/:id`

Busca um usuário por ID.

- **Autenticação:** Bearer token
- **Params:** `id` (inteiro)

**Resposta `200`:**

```json
{
  "id": 1,
  "nome": "Ana Silva",
  "email": "ana@email.com"
}
```

**Erros:**

| Status | Mensagem |
| --- | --- |
| `404` | `Usuário não encontrado.` |
| `401` | Token ausente/inválido. |

---

#### `PUT /usuarios/:id`

Atualiza `nome` e/ou `email` de um usuário. A senha **não** é alterável por este endpoint.

- **Autenticação:** Bearer token
- **Params:** `id` (inteiro)
- **Body (ao menos um campo):**

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `nome` | `string` | não | `trim`, mínimo 3 caracteres. |
| `email` | `string` | não | `trim`, formato válido, não pode estar em uso. |

**Requisição:**

```bash
curl -X PUT http://localhost:3000/usuarios/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Ana Souza"}'
```

**Resposta `200`:**

```json
{
  "id": 1,
  "nome": "Ana Souza",
  "email": "ana@email.com"
}
```

**Erros:**

| Status | Mensagem |
| --- | --- |
| `400` | `Informe ao menos um campo para atualizar.` |
| `400` | `E-mail já em uso.` |
| `400` | `Erro de validação nos dados enviados.` + `details` |
| `404` | `Usuário não encontrado.` |

---

#### `DELETE /usuarios/:id`

Exclui um usuário.

- **Autenticação:** Bearer token
- **Params:** `id` (inteiro)

**Requisição:**

```bash
curl -X DELETE http://localhost:3000/usuarios/1 \
  -H "Authorization: Bearer <token>"
```

**Resposta `204`:** sem corpo.

**Erros:**

| Status | Mensagem |
| --- | --- |
| `404` | `Usuário não encontrado.` |
| `500` | `Erro interno do servidor.` — se o usuário possuir locações (FK `ON DELETE RESTRICT`). |

> A restrição de FK não é convertida em erro de domínio; nesse caso a API responde `500`.

---

### Veículos

#### `POST /veiculos`

Cadastra um veículo.

- **Autenticação:** Bearer token
- **Body:**

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `marca` | `string` | sim | sofre `trim`. |
| `modelo` | `string` | sim | sofre `trim`. |
| `placa` | `string` | sim | `trim` + maiúsculas, única. |
| `ano` | `number` | sim | inteiro. |
| `valorDiaria` | `number` | sim | positivo. |

**Requisição:**

```bash
curl -X POST http://localhost:3000/veiculos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Toyota",
    "modelo": "Corolla",
    "placa": "abc1d23",
    "ano": 2024,
    "valorDiaria": 150.00
  }'
```

**Resposta `201`:**

```json
{
  "id": 1,
  "marca": "Toyota",
  "modelo": "Corolla",
  "placa": "ABC1D23",
  "ano": 2024,
  "valorDiaria": "150.00",
  "disponivel": true
}
```

**Erros:**

| Status | Mensagem |
| --- | --- |
| `400` | `Placa já cadastrada no sistema` |
| `400` | `O valor da diária deve ser um número positivo.` |
| `400` | `Erro de validação nos dados enviados.` + `details` |
| `401` | Token ausente/inválido. |

> `ano` e `valorDiaria` devem ser enviados como **números JSON** (`2024`, `150.00`), não como strings.

---

#### `GET /veiculos`

Lista veículos com paginação e filtro opcional por disponibilidade. Ordenação fixa por `id` **descendente**.

- **Autenticação:** Bearer token
- **Query params:**

| Param | Default | Valores aceitos | Descrição |
| --- | --- | --- | --- |
| `disponivel` | — | `true`, `false` | Filtra por disponibilidade. |
| `page` | `1` | inteiro ≥ 1 | Página atual. |
| `per` | `10` | inteiro ≥ 1 | Itens por página. |

**Requisição:**

```bash
curl "http://localhost:3000/veiculos?disponivel=true&page=1&per=5" \
  -H "Authorization: Bearer <token>"
```

**Resposta `200`:**

```json
{
  "data": [
    {
      "id": 1,
      "marca": "Toyota",
      "modelo": "Corolla",
      "placa": "ABC1D23",
      "ano": 2024,
      "valorDiaria": "150.00",
      "disponivel": true
    }
  ],
  "pagination": {
    "page": 1,
    "per": 5,
    "total": 1,
    "totalOfPages": 1
  }
}
```

**Erros:**

| Status | Mensagem |
| --- | --- |
| `400` | `O parâmetro 'disponivel' deve ser 'true' ou 'false'.` |
| `401` | Token ausente/inválido. |

> Observação: o `total` da paginação considera **todos** os veículos, não apenas os filtrados por `disponivel`.

---

### Locações

Todas as rotas de locação são **protegidas** e operam apenas sobre as locações do usuário autenticado (`usuarioId` extraído do token).

#### `POST /locacoes`

Cria uma locação para o usuário autenticado, reservando o veículo.

- **Autenticação:** Bearer token
- **Body:**

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `veiculoId` | `number` | sim | inteiro positivo. |
| `dataInicio` | `string` (data ISO) | sim | data válida. |
| `dataPrevistaDevolucao` | `string` (data ISO) | sim | posterior a `dataInicio`. |

**Requisição:**

```bash
curl -X POST http://localhost:3000/locacoes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "veiculoId": 1,
    "dataInicio": "2026-11-02T10:00:00.000Z",
    "dataPrevistaDevolucao": "2026-11-05T10:00:00.000Z"
  }'
```

**Resposta `201`:**

```json
{
  "id": 1,
  "usuarioId": 1,
  "veiculoId": 1,
  "dataInicio": "2026-11-02T10:00:00.000Z",
  "dataPrevistaDevolucao": "2026-11-05T10:00:00.000Z",
  "valorTotal": "450.00",
  "status": "ATIVA",
  "veiculo": {
    "id": 1,
    "marca": "Toyota",
    "modelo": "Corolla",
    "placa": "ABC1D23",
    "ano": 2024,
    "valorDiaria": "150.00"
  }
}
```

**Comportamento:**

1. Valida as datas (formato e ordem).
2. Abre uma **transação**.
3. Verifica se o veículo existe (`404` se não).
4. Reserva o veículo com `updateMany` condicionado a `disponivel: true` (`409` se já estiver alugado — evita corrida).
5. Calcula `valorTotal = ceil(duração em dias) × valorDiaria`.
6. Cria a locação com status `ATIVA`.

**Erros:**

| Status | Mensagem |
| --- | --- |
| `400` | `Informe datas válidas.` |
| `400` | `A data prevista de devolução deve ser posterior à data de início.` |
| `400` | `Erro de validação nos dados enviados.` + `details` |
| `401` | Token ausente/inválido. |
| `404` | `Veículo não encontrado.` |
| `409` | `Veículo indisponível para locação.` |

---

#### `GET /locacoes`

Lista as locações do usuário autenticado, com filtro por status e paginação. Ordenação por `id` **descendente**.

- **Autenticação:** Bearer token
- **Query params:**

| Param | Default | Valores aceitos | Descrição |
| --- | --- | --- | --- |
| `status` | — | `ativa`, `finalizada` | Filtra por status (case-insensitive na entrada). |
| `page` | `1` | inteiro ≥ 1 | Página atual. |
| `per` | `10` | inteiro ≥ 1 | Itens por página. |

**Requisição:**

```bash
curl "http://localhost:3000/locacoes?status=ativa&page=1&per=10" \
  -H "Authorization: Bearer <token>"
```

**Resposta `200`:**

```json
{
  "data": [
    {
      "id": 1,
      "usuarioId": 1,
      "veiculoId": 1,
      "dataInicio": "2026-11-02T10:00:00.000Z",
      "dataPrevistaDevolucao": "2026-11-05T10:00:00.000Z",
      "valorTotal": "450.00",
      "status": "ATIVA",
      "veiculo": {
        "id": 1,
        "marca": "Toyota",
        "modelo": "Corolla",
        "placa": "ABC1D23",
        "ano": 2024,
        "valorDiaria": "150.00"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per": 10,
    "total": 1,
    "totalOfPages": 1
  }
}
```

**Erros:**

| Status | Mensagem |
| --- | --- |
| `400` | `O parâmetro 'status' deve ser 'ativa' ou 'finalizada'.` |
| `400` | `O parâmetro 'page' deve ser um número inteiro positivo.` |
| `400` | `O parâmetro 'per' deve ser um número inteiro positivo.` |
| `401` | Token ausente/inválido. |

> O campo `dataDevolucao` **não** é retornado nas listagens nem nas consultas, mesmo após a finalização.

---

#### `GET /locacoes/:id`

Busca uma locação específica **do usuário autenticado**.

- **Autenticação:** Bearer token
- **Params:** `id` (inteiro positivo)

**Requisição:**

```bash
curl http://localhost:3000/locacoes/1 \
  -H "Authorization: Bearer <token>"
```

**Resposta `200`:** mesmo formato de um item de `GET /locacoes`.

**Erros:**

| Status | Mensagem |
| --- | --- |
| `400` | `O parâmetro 'id' deve ser um número inteiro positivo.` |
| `404` | `Locação não encontrada.` (inexistente **ou** pertencente a outro usuário) |
| `401` | Token ausente/inválido. |

---

#### `PATCH /locacoes/:id/finalizar`

Finaliza uma locação ativa do usuário autenticado, registrando a devolução e liberando o veículo.

- **Autenticação:** Bearer token
- **Params:** `id` (inteiro positivo)
- **Body:** nenhum

**Requisição:**

```bash
curl -X PATCH http://localhost:3000/locacoes/1/finalizar \
  -H "Authorization: Bearer <token>"
```

**Resposta `200`:**

```json
{
  "id": 1,
  "usuarioId": 1,
  "veiculoId": 1,
  "dataInicio": "2026-11-02T10:00:00.000Z",
  "dataPrevistaDevolucao": "2026-11-05T10:00:00.000Z",
  "valorTotal": "450.00",
  "status": "FINALIZADA",
  "veiculo": {
    "id": 1,
    "marca": "Toyota",
    "modelo": "Corolla",
    "placa": "ABC1D23",
    "ano": 2024,
    "valorDiaria": "150.00"
  }
}
```

**Comportamento (em transação):**

1. Valida o `id`.
2. Verifica se a locação existe e pertence ao usuário (`404` caso contrário).
3. Rejeita se já estiver `FINALIZADA` (`409`).
4. Atualiza status para `FINALIZADA` e grava `dataDevolucao = now()`.
5. Marca o veículo como `disponivel: true`.

**Erros:**

| Status | Mensagem |
| --- | --- |
| `400` | `O parâmetro 'id' deve ser um número inteiro positivo.` |
| `404` | `Locação não encontrada.` |
| `409` | `Locação já finalizada.` |
| `401` | Token ausente/inválido. |

---

