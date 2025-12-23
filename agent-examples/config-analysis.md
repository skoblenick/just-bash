# Scenario: Configuration Analysis

An AI agent needs to understand and audit the configuration of a Node.js application for deployment.

## Virtual Filesystem

```javascript
const env = new BashEnv({
  files: {
    '/app/package.json': `{
  "name": "api-server",
  "version": "1.5.0",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "express": "^4.18.0",
    "prisma": "^5.0.0",
    "redis": "^4.0.0",
    "jsonwebtoken": "^9.0.0"
  }
}`,
    '/app/.env.example': `# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# External APIs
STRIPE_SECRET_KEY=sk_test_xxx
SENDGRID_API_KEY=SG.xxx

# Feature Flags
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true
`,
    '/app/tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
    '/app/docker-compose.yml': `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
`,
    '/app/Dockerfile': `FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["npm", "start"]
`,
    '/app/.eslintrc.json': `{
  "env": {
    "node": true,
    "es2022": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}`,
    '/app/prisma/schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}
`,
    '/app/vitest.config.ts': `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'dist'],
    },
  },
});
`,
  },
  cwd: '/app',
});
```

## Agent Commands

### 1. List all configuration files

```bash
ls -a /app
```

### 2. Check Node.js version requirements

```bash
grep -A1 "engines" /app/package.json
```

### 3. Review environment variables needed

```bash
cat /app/.env.example
```

### 4. Find all secret/sensitive environment variables

```bash
grep -i "secret\|key\|password" /app/.env.example
```

### 5. Check Docker configuration

```bash
cat /app/Dockerfile
```

### 6. Review Docker Compose services

```bash
cat /app/docker-compose.yml
```

### 7. Check database schema

```bash
cat /app/prisma/schema.prisma
```

### 8. Find all models in schema

```bash
grep "^model" /app/prisma/schema.prisma
```

### 9. Review TypeScript configuration

```bash
cat /app/tsconfig.json
```

### 10. Check ESLint rules

```bash
grep -A5 '"rules"' /app/.eslintrc.json
```

### 11. Find exposed ports in Docker

```bash
grep -i "port\|expose" /app/docker-compose.yml /app/Dockerfile
```

### 12. List all npm scripts

```bash
grep -A10 '"scripts"' /app/package.json
```

### 13. Check test configuration

```bash
cat /app/vitest.config.ts
```

## Deployment Checklist

Based on configuration analysis:

1. **Environment Variables Required**:
   - DATABASE_URL (PostgreSQL connection)
   - REDIS_URL (Redis connection)
   - JWT_SECRET (Must be changed from example!)
   - STRIPE_SECRET_KEY (Production key)
   - SENDGRID_API_KEY (Production key)

2. **Services Required**:
   - PostgreSQL 15
   - Redis 7

3. **Security Concerns**:
   - JWT_SECRET must be a strong random value
   - STRIPE_SECRET_KEY placeholder must be replaced
   - Database credentials in docker-compose should use secrets

4. **Port Mappings**:
   - App: 3000
   - PostgreSQL: 5432
   - Redis: 6379
