# Smart Ranking

Plataforma de microserviços para gerenciamento de desafios, rankings e notificações entre jogadores.

## Arquitetura

```
                         ┌──────────────────┐
                         │   api-gateway    │
                         │     :3000        │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
          ┌─────────▼──┐  ┌──────▼─────┐  ┌───▼──────────┐
          │micro-admin  │  │micro-      │  │micro-        │
          │-backend     │  │desafios    │  │rankings      │
          │  :3001      │  │  :3002     │  │  :3004       │
          └──────┬──────┘  └──────┬─────┘  └───┬──────────┘
                 │                │             │
                 │         ┌──────▼─────┐      │
                 │         │micro-      │      │
                 │         │notificacoes│      │
                 │         │  :3003     │      │
                 │         └────────────┘      │
                 │                             │
        ┌────────▼─────────────────────────────▼────────┐
        │              RabbitMQ :5672                    │
        └───────────────────────────────────────────────┘
        ┌───────────────────┐  ┌────────────────────────┐
        │  MongoDB :27017   │  │  LocalStack :4566      │
        │                   │  │  (S3, SQS, SES, SNS)   │
        └───────────────────┘  └────────────────────────┘
```

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| api-gateway | 3000 | Gateway principal, autenticação JWT/Cognito |
| micro-admin-backend | 3001 | Operações administrativas (categorias, jogadores) |
| micro-desafios | 3002 | Gerenciamento de desafios e partidas |
| micro-notificacoes | 3003 | Envio de notificações por e-mail (SES) |
| micro-rankings | 3004 | Cálculo e gestão de rankings |

## Tecnologias

- **Runtime:** Node.js 22
- **Framework:** NestJS 11
- **Linguagem:** TypeScript 5
- **Banco de dados:** MongoDB 7
- **Mensageria:** RabbitMQ 3 (AMQP)
- **Cloud local:** LocalStack (S3, SQS, SES, SNS)
- **Testes:** Vitest
- **Linting/Formatação:** ESLint 9, Prettier
- **Orquestrador dev:** Foreman (nf)

## Pré-requisitos

- **Node.js 22** — o projeto inclui um `.nvmrc`, basta rodar `nvm use`
- **Docker e Docker Compose** — para a infraestrutura local (MongoDB, RabbitMQ, LocalStack)
- **npm**

## Como rodar o projeto

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd smart-ranking
```

### 2. Instalar o Node.js 22

```bash
nvm use
```

### 3. Instalar dependências

Instala as dependências da raiz e de todos os microserviços:

```bash
npm run install:all
```

### 4. Subir a infraestrutura

```bash
npm run infra
```

Isso inicia os containers Docker em background. Aguarde alguns segundos para que o LocalStack execute o script de inicialização.

### 5. Verificar se os serviços estão rodando

```bash
docker compose ps
```

Você deve ver 3 containers saudáveis:

| Container | Portas |
|-----------|--------|
| rabbitmq | 5672 (AMQP), 15672 (Management UI) |
| mongodb | 27017 |
| localstack | 4566 |

### 6. Iniciar todos os microserviços

```bash
npm run dev
```

O Foreman inicia os 5 serviços simultaneamente com suas respectivas portas.

## Infraestrutura (Docker)

O `docker-compose.yml` define 3 serviços:

### RabbitMQ

- **Imagem:** `rabbitmq:3-management-alpine`
- **Portas:** 5672 (AMQP), 15672 (UI de gerenciamento)
- **Credenciais:** `admin` / `admin`
- **Virtual Host:** `smartranking`
- **Painel de gerenciamento:** http://localhost:15672

### MongoDB

- **Imagem:** `mongo:7`
- **Porta:** 27017
- **Volume:** `mongodb_data` (dados persistentes)

### LocalStack

- **Imagem:** `localstack/localstack:latest`
- **Porta:** 4566
- **Serviços AWS simulados:** S3, SQS, SES, SNS
- **Região:** `us-east-1`

Recursos criados automaticamente pelo script de inicialização (`scripts/localstack-init.sh`):

| Recurso | Nome/Identificador |
|---------|--------------------|
| S3 Bucket | `smart-ranking-files` |
| SQS Queue | `smart-ranking-events` |
| SQS DLQ | `smart-ranking-events-dlq` (maxReceiveCount: 3) |
| SES Identity | `noreply@smartranking.com` |

## Scripts disponíveis

### Raiz do monorepo

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `npm run dev` | Inicia todos os microserviços via Foreman |
| `infra` | `npm run infra` | Sobe os containers Docker em background |
| `infra:stop` | `npm run infra:stop` | Para os containers Docker |
| `install:all` | `npm run install:all` | Instala dependências de todos os serviços |

### Por serviço (executar dentro da pasta do serviço)

| Script | Comando | Descrição |
|--------|---------|-----------|
| `build` | `npm run build` | Compila o projeto |
| `start` | `npm run start` | Inicia em modo produção |
| `start:dev` | `npm run start:dev` | Inicia em modo desenvolvimento (watch) |
| `start:debug` | `npm run start:debug` | Inicia em modo debug (watch) |
| `start:prod` | `npm run start:prod` | Inicia a partir do build (`dist/main`) |
| `lint` | `npm run lint` | Executa o ESLint com auto-fix |
| `format` | `npm run format` | Formata o código com Prettier |
| `test` | `npm run test` | Executa os testes unitários |
| `test:watch` | `npm run test:watch` | Executa os testes em modo watch |
| `test:cov` | `npm run test:cov` | Executa os testes com relatório de cobertura |
| `test:e2e` | `npm run test:e2e` | Executa os testes end-to-end |

## Executando serviços individualmente

Se preferir rodar um serviço específico em vez de todos:

```bash
# Certifique-se de que a infraestrutura está rodando
npm run infra

# Entre na pasta do serviço desejado
cd api-gateway

# Defina a porta (opcional, cada serviço usa a porta padrão do Procfile)
export APP_PORT=3000

# Inicie em modo desenvolvimento
npm run start:dev
```

Portas padrão definidas no `Procfile`:

| Serviço | Porta |
|---------|-------|
| api-gateway | 3000 |
| micro-admin-backend | 3001 |
| micro-desafios | 3002 |
| micro-notificacoes | 3003 |
| micro-rankings | 3004 |

## Testes

```bash
# Entrar na pasta do serviço
cd api-gateway

# Testes unitários
npm run test

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:cov

# Testes end-to-end
npm run test:e2e
```

## Estrutura do projeto

```
smart-ranking/
├── api-gateway/            # Gateway principal (JWT/Cognito)
├── micro-admin-backend/    # Microserviço administrativo
├── micro-desafios/         # Microserviço de desafios
├── micro-notificacoes/     # Microserviço de notificações
├── micro-rankings/         # Microserviço de rankings
├── scripts/
│   └── localstack-init.sh  # Inicialização automática do LocalStack
├── docker-compose.yml      # Infraestrutura local
├── Procfile                # Definição dos processos (Foreman)
├── package.json            # Scripts e dependências da raiz
└── .nvmrc                  # Versão do Node.js (22)
```
