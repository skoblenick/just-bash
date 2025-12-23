# Scenario: Codebase Exploration

An AI agent needs to understand an unfamiliar React codebase to implement a new feature.

## Virtual Filesystem

```javascript
const env = new BashEnv({
  files: {
    '/app/package.json': `{
  "name": "react-dashboard",
  "version": "2.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "zustand": "^4.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}`,
    '/app/src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
`,
    '/app/src/App.tsx': `import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
`,
    '/app/src/components/Layout.tsx': `import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
`,
    '/app/src/components/Sidebar.tsx': `import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export function Sidebar() {
  const user = useAuthStore((state) => state.user);

  return (
    <nav className="w-64 bg-gray-900 text-white">
      <div className="p-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </div>
      <ul className="space-y-2 p-4">
        <li><NavLink to="/">Home</NavLink></li>
        <li><NavLink to="/users">Users</NavLink></li>
        <li><NavLink to="/settings">Settings</NavLink></li>
      </ul>
      {user && <div className="p-4">Logged in as: {user.name}</div>}
    </nav>
  );
}
`,
    '/app/src/components/Header.tsx': `import { useAuthStore } from '../stores/auth';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold">Welcome back!</h2>
      {user && (
        <button onClick={logout} className="text-red-500">
          Logout
        </button>
      )}
    </header>
  );
}
`,
    '/app/src/stores/auth.ts': `import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    // API call would go here
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    set({ user: data.user, token: data.token });
  },
  logout: () => set({ user: null, token: null }),
}));
`,
    '/app/src/pages/Dashboard.tsx': `import { useQuery } from '@tanstack/react-query';
import { StatsCard } from '../components/StatsCard';
import { fetchStats } from '../api/stats';

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-6">
      <StatsCard title="Users" value={stats?.users || 0} />
      <StatsCard title="Revenue" value={stats?.revenue || 0} />
      <StatsCard title="Orders" value={stats?.orders || 0} />
    </div>
  );
}
`,
    '/app/src/pages/Users.tsx': `import { useQuery } from '@tanstack/react-query';
import { UserTable } from '../components/UserTable';
import { fetchUsers } from '../api/users';

export function Users() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <UserTable users={users || []} />
    </div>
  );
}
`,
    '/app/src/pages/Settings.tsx': `import { useAuthStore } from '../stores/auth';

export function Settings() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
      </div>
    </div>
  );
}
`,
    '/app/src/api/users.ts': `export async function fetchUsers() {
  const response = await fetch('/api/users');
  return response.json();
}

export async function createUser(data: { name: string; email: string }) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
`,
    '/app/src/api/stats.ts': `export async function fetchStats() {
  const response = await fetch('/api/stats');
  return response.json();
}
`,
  },
  cwd: '/app',
});
```

## Agent Commands

### 1. Understand project structure

```bash
ls -R /app/src
```

### 2. Check dependencies and tech stack

```bash
cat /app/package.json
```

### 3. Find the entry point

```bash
cat /app/src/main.tsx
```

### 4. Understand routing structure

```bash
grep -n "Route" /app/src/App.tsx
```

### 5. Find all page components

```bash
ls /app/src/pages
```

### 6. Find state management (stores)

```bash
ls /app/src/stores
```

### 7. Find all component imports of the store

```bash
grep -r "useAuthStore" /app/src
```

### 8. Find all API calls

```bash
grep -r "fetch(" /app/src
```

### 9. Find all React Query usage

```bash
grep -r "useQuery" /app/src
```

### 10. Review the auth store implementation

```bash
cat /app/src/stores/auth.ts
```

### 11. Find all interface definitions

```bash
grep -rn "^interface" /app/src
```

### 12. Find export statements

```bash
grep -r "^export" /app/src/components
```

## Expected Understanding

1. **Framework**: React 18 with TypeScript
2. **Routing**: react-router-dom v6
3. **State Management**: Zustand for auth state
4. **Data Fetching**: TanStack React Query
5. **Structure**:
   - /pages - Route components
   - /components - Reusable UI components
   - /stores - Zustand stores
   - /api - API functions
