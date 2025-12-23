# Scenario: Log Analysis and Debugging

An AI agent is tasked with analyzing application logs to find errors and understand system behavior.

## Virtual Filesystem

```javascript
const env = new BashEnv({
  files: {
    '/logs/app.log': `2024-01-15 08:00:01 [INFO] Application starting...
2024-01-15 08:00:02 [INFO] Connecting to database...
2024-01-15 08:00:03 [INFO] Database connected successfully
2024-01-15 08:00:04 [INFO] Starting HTTP server on port 3000
2024-01-15 08:00:05 [INFO] Server ready to accept connections
2024-01-15 08:15:23 [INFO] Request: GET /api/users - 200 - 45ms
2024-01-15 08:15:45 [INFO] Request: GET /api/users/123 - 200 - 12ms
2024-01-15 08:16:01 [ERROR] Request: POST /api/users - 500 - Database connection lost
2024-01-15 08:16:01 [ERROR] Stack trace: ConnectionError at Database.query
2024-01-15 08:16:02 [WARN] Attempting database reconnection (1/5)
2024-01-15 08:16:03 [WARN] Attempting database reconnection (2/5)
2024-01-15 08:16:04 [INFO] Database reconnected successfully
2024-01-15 08:16:05 [INFO] Request: POST /api/users - 201 - 89ms
2024-01-15 08:30:00 [INFO] Request: GET /api/users - 200 - 32ms
2024-01-15 08:45:12 [ERROR] Request: GET /api/users/invalid - 400 - Invalid user ID format
2024-01-15 09:00:00 [INFO] Scheduled job: cleanup started
2024-01-15 09:00:15 [INFO] Scheduled job: cleanup completed - removed 42 records
2024-01-15 09:15:33 [ERROR] Memory usage critical: 95% - initiating garbage collection
2024-01-15 09:15:34 [INFO] Garbage collection completed - memory at 45%
2024-01-15 09:30:00 [ERROR] Request: POST /api/auth/login - 401 - Invalid credentials for user: admin@example.com
2024-01-15 09:30:01 [WARN] Failed login attempt from IP: 192.168.1.100
2024-01-15 09:30:05 [ERROR] Request: POST /api/auth/login - 401 - Invalid credentials for user: admin@example.com
2024-01-15 09:30:06 [WARN] Failed login attempt from IP: 192.168.1.100
2024-01-15 09:30:10 [ERROR] Request: POST /api/auth/login - 401 - Invalid credentials for user: admin@example.com
2024-01-15 09:30:11 [WARN] Rate limit exceeded for IP: 192.168.1.100 - blocking for 15 minutes
`,
    '/logs/access.log': `192.168.1.50 - - [15/Jan/2024:08:15:23] "GET /api/users HTTP/1.1" 200 1234
192.168.1.50 - - [15/Jan/2024:08:15:45] "GET /api/users/123 HTTP/1.1" 200 256
192.168.1.50 - - [15/Jan/2024:08:16:01] "POST /api/users HTTP/1.1" 500 89
192.168.1.50 - - [15/Jan/2024:08:16:05] "POST /api/users HTTP/1.1" 201 312
192.168.1.100 - - [15/Jan/2024:09:30:00] "POST /api/auth/login HTTP/1.1" 401 45
192.168.1.100 - - [15/Jan/2024:09:30:05] "POST /api/auth/login HTTP/1.1" 401 45
192.168.1.100 - - [15/Jan/2024:09:30:10] "POST /api/auth/login HTTP/1.1" 401 45
192.168.1.75 - - [15/Jan/2024:10:00:00] "GET /api/health HTTP/1.1" 200 12
`,
    '/logs/error.log': `[2024-01-15T08:16:01.234Z] ConnectionError: Database connection lost
    at Database.query (/app/src/database.ts:45:11)
    at UserService.create (/app/src/services/user.ts:28:20)
    at UserRouter.post (/app/src/routes/user.ts:15:25)

[2024-01-15T08:45:12.567Z] ValidationError: Invalid user ID format
    at validateId (/app/src/utils/validation.ts:12:9)
    at UserRouter.get (/app/src/routes/user.ts:8:5)

[2024-01-15T09:15:33.890Z] MemoryWarning: Heap usage exceeded 95%
    at MemoryMonitor.check (/app/src/monitoring/memory.ts:22:7)
    at setInterval (/app/src/index.ts:45:3)
`,
  },
  cwd: '/logs',
});
```

## Agent Commands

### 1. Get an overview of log files

```bash
ls -l /logs
```

### 2. Find all ERROR entries

```bash
grep ERROR /logs/app.log
```

### 3. Count errors by type

```bash
grep -c ERROR /logs/app.log
```

### 4. Find all WARN entries

```bash
grep WARN /logs/app.log
```

### 5. Find failed requests (500 status codes)

```bash
grep " 500 " /logs/access.log
```

### 6. Find all login failures

```bash
grep "401" /logs/access.log
```

### 7. Check for suspicious activity (multiple failed logins from same IP)

```bash
grep "192.168.1.100" /logs/access.log
```

### 8. Review detailed error stack traces

```bash
cat /logs/error.log
```

### 9. Find database-related issues

```bash
grep -i "database\|connection" /logs/app.log
```

### 10. Get last 10 entries (simulated with head)

```bash
tail -n 5 /logs/app.log
```

### 11. Find memory-related warnings

```bash
grep -i memory /logs/app.log
```

### 12. Count requests by status code

```bash
grep -c "200" /logs/access.log
```

## Expected Findings

1. **Database Issues**: Temporary connection loss at 08:16:01
2. **Security Concern**: Potential brute force attack from 192.168.1.100 (3 failed logins)
3. **Performance**: Memory spike at 09:15:33 reaching 95%
4. **Validation Error**: Invalid user ID format at 08:45:12
5. **Rate Limiting**: Working correctly - blocked suspicious IP
