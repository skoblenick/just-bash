# Scenario: Code Review

An AI agent is tasked with reviewing a TypeScript web application for code quality issues.

## Virtual Filesystem

```javascript
const env = new BashEnv({
  files: {
    '/project/package.json': `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}`,
    '/project/src/index.ts': `import express from 'express';
import { userRouter } from './routes/user';
import { authMiddleware } from './middleware/auth';

const app = express();
app.use(express.json());
app.use(authMiddleware);
app.use('/api/users', userRouter);

// TODO: Add error handling middleware
// FIXME: Port should be from env

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
`,
    '/project/src/routes/user.ts': `import { Router } from 'express';
import { UserService } from '../services/user';

export const userRouter = Router();
const userService = new UserService();

userRouter.get('/', async (req, res) => {
  const users = await userService.getAll();
  res.json(users);
});

userRouter.get('/:id', async (req, res) => {
  const user = await userService.getById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// TODO: Add input validation
userRouter.post('/', async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json(user);
});
`,
    '/project/src/services/user.ts': `interface User {
  id: string;
  name: string;
  email: string;
}

export class UserService {
  private users: User[] = [];

  async getAll(): Promise<User[]> {
    return this.users;
  }

  async getById(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async create(data: Partial<User>): Promise<User> {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name || '',
      email: data.email || '',
    };
    this.users.push(user);
    return user;
  }
}
`,
    '/project/src/middleware/auth.ts': `import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization;

  // FIXME: Implement proper JWT validation
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // TODO: Verify token and attach user to request
  next();
}
`,
    '/project/README.md': `# My App

A simple Express API.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## API Endpoints

- GET /api/users - List all users
- GET /api/users/:id - Get user by ID
- POST /api/users - Create new user
`,
  },
  cwd: '/project',
});
```

## Agent Commands

### 1. Understand project structure

```bash
ls -R /project
```

### 2. Check package dependencies

```bash
cat /project/package.json
```

### 3. Find all TypeScript files

```bash
ls /project/src | grep ts
```

### 4. Find TODO comments that need attention

```bash
grep -r TODO /project/src
```

### 5. Find FIXME comments indicating bugs

```bash
grep -r FIXME /project/src
```

### 6. Review the main entry point

```bash
cat /project/src/index.ts
```

### 7. Find all route definitions

```bash
grep -r "Router()" /project/src
```

### 8. Check for potential security issues (looking for hardcoded values)

```bash
grep -rn "3000\|password\|secret" /project/src
```

### 9. Find all exported functions/classes

```bash
grep -r "^export" /project/src
```

### 10. Count lines of code

```bash
cat /project/src/index.ts /project/src/routes/user.ts /project/src/services/user.ts /project/src/middleware/auth.ts | wc -l
```

## Expected Findings

1. **TODO items**: 3 items needing implementation
2. **FIXME items**: 2 bugs to fix
3. **Security concern**: Hardcoded port 3000
4. **Missing**: Error handling middleware
5. **Missing**: Input validation on POST endpoint
