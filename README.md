# TCC Project

REST API with JWT authentication for managing users, accounts, and financial planning.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd tcc_project
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables

Create a `.env` file at the project root (use `.env.example` as a reference). Below is a complete example of the variables supported by the code:

```env
# Environment
PROD=false
PORT=3000

# Frontend URL (used when PROD=true and for password reset links)
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL)
# Example (compatible with the included docker-compose):
# postgresql://root269:sh4432__@localhost:5432/financial_db?schema=public
DATABASE_URL=

# JWT
JWT_SECRET=your-jwt-secret-here
# Optional: dedicated secret for password reset tokens
JWT_PASSWORD_RESET_SECRET=

# SMTP (required for email features: forgot/reset password)
SMTP_SERVER=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

# Integrations (Axios/OpenRouter)
AI_KEY=
# Metadata used in headers when calling the OpenRouter API
APP_URL=http://localhost:3000
APP_NAME=TCC Project
```

#### Database with Docker (optional)
If you prefer to quickly spin up a local Postgres:
```bash
docker-compose up -d postgres
```
Then, set `DATABASE_URL` in `.env` to point to the database above.

4. Generate the Prisma Client
```bash
npm run prisma:generate
```

5. Run database migrations
```bash
# Apply existing migrations (deploy)
npm run prisma:apply

# Development: create a new migration (replace <name>)
npm run prisma:migrate <name>
```

6. Start the server
```bash
# Development
npm run dev

# Production
npm run run
```

The server will be available at `http://localhost:3000`

## 🔐 Authentication

This project uses JWT authentication. **All routes require authentication, except:**

- `POST /register` - Register new users
- `POST /login` - User login
- `POST /forgot-password` - Password recovery
- `POST /reset-password` - Password reset

To access protected routes, include the JWT token in the header:
```
Authorization: Bearer <your-token-here>
```

📖 **Authentication documentation:** see public and protected routes at `http://localhost:3000/api-docs` (Swagger).

## 🌐 CORS (Cross-Origin Resource Sharing)

The project has dynamic CORS configuration based on the `PROD` environment variable:

### Development mode (`PROD=false`)
- ✅ Accepts requests from **any origin** (`*`)
- Ideal for local development and testing

### Production mode (`PROD=true`)
- 🔒 Accepts requests **only from the URL configured** in `FRONTEND_URL`
- Increases security in production environments

## 📡 HTTP Client (Axios) - External APIs

⚠️ **This is a BACKEND**: Axios is used to consume **external APIs** (AI, CEP, payments), not for the frontend to consume this API.

### OpenRouter API (AI)
```typescript
import { openRouterApi } from '@/infra/config/axios'

const response = await openRouterApi.post('/chat/completions', {
  model: 'mistralai/mistral-7b-instruct',
  messages: [{ role: 'user', content: 'Create a financial plan' }]
})
```

### Generic External APIs
```typescript
import { externalApi } from '@/infra/config/axios'

// Lookup CEP (Brazilian postal code)
const cep = await externalApi.get('https://viacep.com.br/ws/01001000/json/')

// Send email via SendGrid
await externalApi.post('https://api.sendgrid.com/v3/mail/send', data)
```

The `openRouterApi` and `externalApi` clients are exported from `src/infra/config/axios/index.ts`.

## 📚 API Documentation

Access the interactive Swagger documentation at: `http://localhost:3000/api-docs`

## 🧪 Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# All (unit + integration)
npm run test:all
```

## 📁 Project Structure

```
src/
├── domain/           # Entities, use cases, and business rules
├── infra/            # Infrastructure (repositories, external services)
├── presentation/     # Controllers, middlewares, and HTTP protocols
└── ...
```

## 🛠️ Technologies

- **Node.js** - JavaScript runtime
- **TypeScript** - Typed superset of JavaScript
- **Express** - Web framework
- **Prisma** - Database ORM
- **JWT** - Authentication
- **Axios** - HTTP client
- **CORS** - Cross-origin access control
- **Jest** - Testing framework
- **Swagger** - API documentation

## 📝 Available Scripts

- `npm run dev` - Start the server in development mode
- `npm run build` - Build the project
- `npm run run` - Run the compiled project
- `npm test` - Run all tests
- `npm run test:all` - Run unit and integration sequentially
- `npm run prisma:migrate` - Create a new migration
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:apply` - Apply pending migrations
