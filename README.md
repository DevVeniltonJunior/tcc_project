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

Crie um arquivo `.env` na raiz do projeto (use `.env.example` como referência)

4. Execute as migrações do banco de dados
```bash
npm run prisma:apply
```

5. Inicie o servidor
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

📖 **Documentação completa de autenticação:** [AUTHENTICATION.md](./AUTHENTICATION.md)

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
- **Jest** - Framework de testes
- **Swagger** - Documentação da API

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o projeto
- `npm run run` - Executa o projeto compilado
- `npm test` - Executa todos os testes
- `npm run prisma:migrate` - Cria nova migração
- `npm run prisma:apply` - Aplica migrações pendentes