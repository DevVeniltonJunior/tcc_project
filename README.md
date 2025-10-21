# TCC Project

API REST com sistema de autenticação JWT para gerenciamento de usuários, contas e planejamentos financeiros.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js (v18 ou superior)
- PostgreSQL
- npm ou yarn

### Instalação

1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd tcc_project
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (use `.env.example` como referência). Abaixo um exemplo completo das variáveis suportadas pelo código:

```env
# Ambiente
PROD=false
PORT=3000

# Frontend URL (usado quando PROD=true e para links de recuperação de senha)
FRONTEND_URL=http://localhost:5173

# Banco de Dados (PostgreSQL)
# Exemplo (compatível com docker-compose incluso):
# postgresql://root269:sh4432__@localhost:5432/financial_db?schema=public
DATABASE_URL=

# JWT
JWT_SECRET=your-jwt-secret-here
# Opcional: segredo específico para tokens de recuperação de senha
JWT_PASSWORD_RESET_SECRET=

# SMTP (necessário para funcionalidades de e-mail: esqueci/redefinir senha)
SMTP_SERVER=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

# Integrações (Axios/OpenRouter)
AI_KEY=
# Metadados usados nos headers quando chamando a OpenRouter API
APP_URL=http://localhost:3000
APP_NAME=TCC Project
```

#### Banco de dados com Docker (opcional)
Se preferir subir um Postgres local rapidamente:
```bash
docker-compose up -d postgres
```
Em seguida, ajuste a `DATABASE_URL` no `.env` para apontar para o banco acima.

4. Gere o Prisma Client
```bash
npm run prisma:generate
```

5. Execute as migrações do banco de dados
```bash
# Aplica migrações existentes (deploy)
npm run prisma:apply

# Desenvolvimento: criar uma nova migração (substitua <nome>)
npm run prisma:migrate <nome>
```

6. Inicie o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm run run
```

O servidor estará disponível em `http://localhost:3000`

## 🔐 Autenticação

Este projeto utiliza autenticação JWT. **Todas as rotas requerem autenticação, exceto:**

- `POST /register` - Registro de novos usuários
- `POST /login` - Login de usuários
- `POST /forgot-password` - Recuperação de senha
- `POST /reset-password` - Redefinição de senha

Para acessar rotas protegidas, inclua o token JWT no header:
```
Authorization: Bearer <seu-token-aqui>
```

📖 **Documentação de autenticação:** consulte as rotas públicas e protegidas em `http://localhost:3000/api-docs` (Swagger).

## 🌐 CORS (Cross-Origin Resource Sharing)

O projeto possui configuração dinâmica de CORS baseada na variável de ambiente `PROD`:

### Modo Desenvolvimento (`PROD=false`)
- ✅ Aceita requisições de **qualquer origem** (`*`)
- Ideal para desenvolvimento local e testes

### Modo Produção (`PROD=true`)
- 🔒 Aceita requisições **apenas da URL configurada** em `FRONTEND_URL`
- Aumenta a segurança em ambiente de produção

## 📡 Cliente HTTP (Axios) - APIs Externas

⚠️ **Este é um BACKEND**: O Axios é usado para consumir **APIs externas** (IA, CEP, pagamentos), não para o frontend consumir esta API.

### OpenRouter API (IA)
```typescript
import { openRouterApi } from '@/infra/config/axios'

const response = await openRouterApi.post('/chat/completions', {
  model: 'mistralai/mistral-7b-instruct',
  messages: [{ role: 'user', content: 'Crie um planejamento' }]
})
```

### APIs Externas Genéricas
```typescript
import { externalApi } from '@/infra/config/axios'

// Consultar CEP
const cep = await externalApi.get('https://viacep.com.br/ws/01001000/json/')

// Enviar email via SendGrid
await externalApi.post('https://api.sendgrid.com/v3/mail/send', data)
```

Os clientes `openRouterApi` e `externalApi` são exportados de `src/infra/config/axios/index.ts`.

## 📚 Documentação da API

Acesse a documentação interativa Swagger em: `http://localhost:3000/api-docs`

## 🧪 Testes

```bash
# Todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Apenas testes de integração
npm run test:integration

# Todos (unit + integration)
npm run test:all
```

## 📁 Estrutura do Projeto

```
src/
├── domain/           # Entidades, casos de uso e regras de negócio
├── infra/            # Infraestrutura (repositórios, serviços externos)
├── presentation/     # Controllers, middlewares e protocolos HTTP
└── ...
```

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Superset tipado do JavaScript
- **Express** - Framework web
- **Prisma** - ORM para banco de dados
- **JWT** - Autenticação
- **Axios** - Cliente HTTP
- **CORS** - Controle de acesso cross-origin
- **Jest** - Framework de testes
- **Swagger** - Documentação da API

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o projeto
- `npm run run` - Executa o projeto compilado
- `npm test` - Executa todos os testes
- `npm run test:all` - Executa unit e integration em sequência
- `npm run prisma:migrate` - Cria nova migração
- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:apply` - Aplica migrações pendentes