# Scenario: Bug Investigation

An AI agent is tasked with investigating a bug report: "Users report intermittent 500 errors when updating their profile."

## Virtual Filesystem

```javascript
const env = new BashEnv({
  files: {
    '/app/src/routes/profile.ts': `import { Router } from 'express';
import { ProfileService } from '../services/profile';
import { validateProfileUpdate } from '../validators/profile';
import { authMiddleware } from '../middleware/auth';

export const profileRouter = Router();
const profileService = new ProfileService();

profileRouter.use(authMiddleware);

profileRouter.get('/', async (req, res) => {
  try {
    const profile = await profileService.getByUserId(req.user.id);
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

profileRouter.put('/', async (req, res) => {
  try {
    const errors = validateProfileUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updated = await profileService.update(req.user.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
`,
    '/app/src/services/profile.ts': `import { db } from '../database';
import { cache } from '../cache';

export class ProfileService {
  async getByUserId(userId: string) {
    // Try cache first
    const cached = await cache.get(\`profile:\${userId}\`);
    if (cached) {
      return JSON.parse(cached);
    }

    const profile = await db.profile.findUnique({
      where: { userId },
    });

    if (profile) {
      await cache.set(\`profile:\${userId}\`, JSON.stringify(profile), 'EX', 300);
    }

    return profile;
  }

  async update(userId: string, data: any) {
    // BUG: Race condition - cache might be stale
    const profile = await db.profile.update({
      where: { userId },
      data: {
        name: data.name,
        bio: data.bio,
        avatar: data.avatar,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    await cache.del(\`profile:\${userId}\`);

    return profile;
  }
}
`,
    '/app/src/database.ts': `import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Connection handling
db.$connect()
  .then(() => console.log('Database connected'))
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.$disconnect();
  process.exit(0);
});
`,
    '/app/src/cache.ts': `import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const cache = createClient({ url: redisUrl });

cache.on('error', (err) => {
  console.error('Redis error:', err);
  // BUG: Not handling reconnection properly
});

cache.on('connect', () => {
  console.log('Redis connected');
});

// Initialize connection
cache.connect().catch(console.error);
`,
    '/app/src/middleware/auth.ts': `import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // BUG: Not distinguishing between expired and invalid tokens
    return res.status(401).json({ error: 'Invalid token' });
  }
}
`,
    '/app/src/validators/profile.ts': `export function validateProfileUpdate(data: any): string[] {
  const errors: string[] = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('Name must be a string');
    } else if (data.name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }
  }

  if (data.bio !== undefined) {
    if (typeof data.bio !== 'string') {
      errors.push('Bio must be a string');
    } else if (data.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }
  }

  // BUG: Missing avatar URL validation
  if (data.avatar !== undefined && typeof data.avatar !== 'string') {
    errors.push('Avatar must be a string');
  }

  return errors;
}
`,
    '/app/logs/error-2024-01-15.log': `[2024-01-15T10:23:45.123Z] Error updating profile: PrismaClientKnownRequestError:
    An operation failed because it depends on one or more records that were required but not found.
    at updateProfile (/app/src/services/profile.ts:25:27)
    at profileRouter.put (/app/src/routes/profile.ts:24:31)

[2024-01-15T10:25:12.456Z] Redis error: Error: connect ECONNREFUSED 127.0.0.1:6379

[2024-01-15T10:25:13.789Z] Error updating profile: Error: Connection is closed.
    at RedisClient.sendCommand (/app/node_modules/redis/lib/client.js:234:11)
    at ProfileService.update (/app/src/services/profile.ts:32:17)

[2024-01-15T10:30:01.234Z] Error updating profile: PrismaClientKnownRequestError:
    Transaction failed due to a write conflict or a deadlock.
    at updateProfile (/app/src/services/profile.ts:25:27)

[2024-01-15T11:15:45.567Z] Redis error: Error: connect ECONNREFUSED 127.0.0.1:6379

[2024-01-15T11:15:46.890Z] Error updating profile: Error: Connection is closed.
    at RedisClient.sendCommand (/app/node_modules/redis/lib/client.js:234:11)
`,
    '/app/logs/access-2024-01-15.log': `[2024-01-15T10:23:44] PUT /api/profile - user:123 - 500 - 234ms
[2024-01-15T10:23:50] PUT /api/profile - user:456 - 200 - 45ms
[2024-01-15T10:25:10] PUT /api/profile - user:789 - 500 - 5023ms
[2024-01-15T10:25:15] PUT /api/profile - user:123 - 500 - 102ms
[2024-01-15T10:30:00] PUT /api/profile - user:456 - 500 - 1234ms
[2024-01-15T10:30:05] PUT /api/profile - user:456 - 200 - 89ms
[2024-01-15T11:15:44] PUT /api/profile - user:999 - 500 - 5012ms
[2024-01-15T11:15:50] PUT /api/profile - user:999 - 500 - 156ms
`,
  },
  cwd: '/app',
});
```

## Agent Investigation Commands

### 1. Check recent error logs

```bash
cat /app/logs/error-2024-01-15.log
```

### 2. Find 500 errors in access logs

```bash
grep " 500 " /app/logs/access-2024-01-15.log
```

### 3. Count errors by type

```bash
grep -c "Redis error" /app/logs/error-2024-01-15.log
```

### 4. Find database-related errors

```bash
grep -i "prisma\|database" /app/logs/error-2024-01-15.log
```

### 5. Review the profile update endpoint

```bash
cat /app/src/routes/profile.ts
```

### 6. Review the profile service

```bash
cat /app/src/services/profile.ts
```

### 7. Check cache implementation

```bash
cat /app/src/cache.ts
```

### 8. Find error handling patterns

```bash
grep -n "catch\|error" /app/src/services/profile.ts
```

### 9. Look for "BUG" comments

```bash
grep -rn "BUG:" /app/src
```

### 10. Find timeout or connection issues

```bash
grep -i "timeout\|connection\|refused" /app/logs/error-2024-01-15.log
```

### 11. Check long-running requests (>1000ms)

```bash
grep -E "[0-9]{4}ms" /app/logs/access-2024-01-15.log
```

### 12. Review database configuration

```bash
cat /app/src/database.ts
```

## Root Cause Analysis

Based on investigation:

### Primary Issues Found:

1. **Redis Connection Failures**:
   - Error logs show `ECONNREFUSED` errors
   - Cache client doesn't handle reconnection properly
   - Found BUG comment in `/app/src/cache.ts:7`

2. **Database Conflicts**:
   - "Transaction failed due to deadlock" errors
   - Possible race condition when updating profile
   - Found BUG comment in `/app/src/services/profile.ts:19`

3. **Missing Error Handling**:
   - Cache failures cause profile updates to fail
   - No fallback when Redis is unavailable

### Recommended Fixes:

1. Add Redis reconnection logic with exponential backoff
2. Add try-catch around cache operations with fallback
3. Consider using database transactions for profile updates
4. Add retry logic for transient database errors
