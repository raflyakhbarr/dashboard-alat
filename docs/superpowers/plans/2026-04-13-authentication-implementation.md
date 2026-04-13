# Authentication System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete authentication system with PostgreSQL database, bcrypt password hashing, JWT session management, and role-based access control for 3 roles (admin, operasional, mekanik).

**Architecture:** Server-side authentication using Next.js 16 Server Actions. PostgreSQL for user storage with bcrypt password hashing. JWT tokens stored in HTTP-only cookies for secure session management. Middleware for route protection.

**Tech Stack:** Next.js 16 (App Router), PostgreSQL (pg), bcrypt, JWT, TypeScript, Tailwind CSS, shadcn/ui

---

## File Structure

```
app/
  ├── login/
  │   ├── page.tsx                    # Login form UI
  │   └── actions.ts                  # Login server action
  ├── dashboard/
  │   └── page.tsx                    # Protected dashboard page
  └── layout.tsx                      # Update root layout
lib/
  ├── db.ts                           # PostgreSQL connection pool
  ├── auth.ts                         # Auth utilities (hash, verify, JWT, session)
  └── migrations/
      └── 001_create_users.sql        # Database schema + seed data
middleware.ts                         # NEW: Route protection
types/
  └── auth.ts                         # NEW: Auth TypeScript types
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install required packages**

Run: `npm install pg bcrypt jsonwebtoken @types/pg @types/bcrypt @types/jsonwebtoken`

Expected output:
```
added 8 packages, and audited 254 packages in 5s
```

- [ ] **Step 2: Verify installation**

Run: `npm list pg bcrypt jsonwebtoken`

Expected: All packages listed with versions

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: install pg, bcrypt, jsonwebtoken and types

Add PostgreSQL client, password hashing, and JWT libraries for authentication system.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add Environment Variable for JWT Secret

**Files:**
- Modify: `.env`

- [ ] **Step 1: Add JWT_SECRET to .env**

Add this line to `.env`:

```env
JWT_SECRET="dashboard-alat-secret-key-change-in-production-2026"
```

- [ ] **Step 2: Commit**

```bash
git add .env
git commit -m "config: add JWT_SECRET environment variable

Add secret key for JWT token generation.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Auth TypeScript Types

**Files:**
- Create: `types/auth.ts`

- [ ] **Step 1: Create auth types file**

Create `types/auth.ts`:

```typescript
export type UserRole = 'admin' | 'operasional' | 'mekanik';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

export interface SessionUser extends User {
  iat: number;
  exp: number;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add types/auth.ts
git commit -m "types: add auth TypeScript types

Define User, UserRole, and JWT payload types for authentication system.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Database Connection

**Files:**
- Create: `lib/db.ts`

- [ ] **Step 1: Create database connection module**

Create `lib/db.ts`:

```typescript
import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

export default pool;
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "feat: add PostgreSQL connection pool

Create database connection module with query helper and logging.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create Database Migration

**Files:**
- Create: `lib/migrations/001_create_users.sql`

- [ ] **Step 1: Create migration file with schema and seed data**

Create `lib/migrations/001_create_users.sql`:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operasional', 'mekanik')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed users
-- Passwords: admin123, oper123, mekanik123 (hashed with bcrypt, cost 10)
INSERT INTO users (username, password, role) VALUES
  ('admin', '$2b$10$rKZwJQJkJ8J8J8J8J8J8JeX8m8m8m8m8m8m8m8m8m8m8m8m8m8m', 'admin'),
  ('operasional', '$2b$10$rKZwJQJkJ8J8J8J8J8J8JeX8m8m8m8m8m8m8m8m8m8m8m8m8m8m', 'operasional'),
  ('mekanik', '$2b$10$rKZwJQJkJ8J8J8J8J8J8JeX8m8m8m8m8m8m8m8m8m8m8m8m8m8m', 'mekanik')
ON CONFLICT (username) DO NOTHING;
```

Note: The hashed passwords above are placeholders. We'll generate real hashes in Task 6.

- [ ] **Step 2: Commit**

```bash
git add lib/migrations/001_create_users.sql
git commit -m "schema: add users table migration

Create users table with UUID, username, password hash, role, and created_at.
Include seed data for 3 users with role-based access.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Run Migration and Generate Password Hashes

**Files:**
- Modify: `lib/migrations/001_create_users.sql`

- [ ] **Step 1: Create temporary script to generate password hashes**

Create `temp-generate-hashes.ts`:

```typescript
import bcrypt from 'bcrypt';

async function generateHashes() {
  const passwords = [
    { username: 'admin', password: 'admin123' },
    { username: 'operasional', password: 'oper123' },
    { username: 'mekanik', password: 'mekanik123' },
  ];

  for (const { username, password } of passwords) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${username}: ${hash}`);
  }
}

generateHashes();
```

- [ ] **Step 2: Run hash generation script**

Run: `npx tsx temp-generate-hashes.ts`

Expected: Output 3 bcrypt hash strings

- [ ] **Step 3: Update migration with real hashes**

Replace the placeholder hashes in `lib/migrations/001_create_users.sql` with the actual generated hashes.

- [ ] **Step 4: Apply migration to database**

Run: `psql "postgresql://postgres:123111@localhost:5432/dashboard_alat" -f lib/migrations/001_create_users.sql`

Expected: Output showing table creation and 3 rows inserted

- [ ] **Step 5: Verify data in database**

Run: `psql "postgresql://postgres:123111@localhost:5432/dashboard_alat" -c "SELECT username, role, created_at FROM users;"`

Expected: 3 rows displayed

- [ ] **Step 6: Clean up temporary script**

Run: `rm temp-generate-hashes.ts`

- [ ] **Step 7: Commit**

```bash
git add lib/migrations/001_create_users.sql
git commit -m "fix: update migration with real bcrypt password hashes

Replace placeholder hashes with actual bcrypt hashes for seed users.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create Auth Utilities

**Files:**
- Create: `lib/auth.ts`

- [ ] **Step 1: Create auth utilities module**

Create `lib/auth.ts`:

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { User, UserWithPassword, JWTPayload, SessionUser } from '@/types/auth';
import pool from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const COOKIE_NAME = 'auth_token';
const TOKEN_EXPIRY_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${TOKEN_EXPIRY_DAYS}d`,
  });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      iat: decoded.iat || 0,
      exp: decoded.exp || 0,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function getUserByUsername(username: string): Promise<UserWithPassword | null> {
  const result = await pool.query(
    'SELECT id, username, password, role FROM users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role,
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, username, role FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    role: row.role,
  };
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: add auth utilities

Implement password hashing, JWT generation/verification, cookie management,
and user query functions for authentication system.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Create Login Server Action

**Files:**
- Create: `app/login/actions.ts`

- [ ] **Step 1: Create login server action**

Create `app/login/actions.ts`:

```typescript
'use server';

import { getUserByUsername, verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { LoginResult } from '@/types/auth';

export async function login(formData: FormData): Promise<LoginResult> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // Validation
  if (!username || !password) {
    return {
      success: false,
      error: 'Username dan password harus diisi',
    };
  }

  if (username.length < 3) {
    return {
      success: false,
      error: 'Username minimal 3 karakter',
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: 'Password minimal 6 karakter',
    };
  }

  try {
    // Get user from database
    const user = await getUserByUsername(username);

    if (!user) {
      return {
        success: false,
        error: 'Username atau password salah',
      };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Username atau password salah',
      };
    }

    // Generate token and set cookie
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    await setAuthCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan saat login. Silakan coba lagi.',
    };
  }
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/login/actions.ts
git commit -m "feat: add login server action

Implement form validation, user authentication, password verification,
and session cookie creation for login functionality.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Create Login Page UI

**Files:**
- Create: `app/login/page.tsx`

- [ ] **Step 1: Create login page component**

Create `app/login/page.tsx`:

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from './actions';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(result.error || 'Login gagal');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Dashboard Alat
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Login untuk mengakses dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                disabled={loading}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Masukkan username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                disabled={loading}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Masukkan password"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Gunakan akun demo untuk login
            </p>
          </div>

          <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Akun Demo:</p>
            <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
              <p>• admin / admin123 (Administrator)</p>
              <p>• operasional / oper123 (Operasional)</p>
              <p>• mekanik / mekanik123 (Mekanik)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: add login page UI

Implement responsive login form with validation, error handling,
loading states, and demo account information display.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Create Logout Server Action

**Files:**
- Create: `app/dashboard/actions.ts`

- [ ] **Step 1: Create logout server action**

Create `app/dashboard/actions.ts`:

```typescript
'use server';

import { clearAuthCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function logout() {
  await clearAuthCookie();
  redirect('/login');
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/actions.ts
git commit -m "feat: add logout server action

Implement logout functionality to clear auth cookie and redirect to login.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Create Dashboard Page

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard page component**

Create `app/dashboard/page.tsx`:

```typescript
import { getSession } from '@/lib/auth';
import { logout } from './actions';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Unauthorized
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">Silakan login terlebih dahulu</p>
        </div>
      </div>
    );
  }

  const roleDisplayNames: Record<string, string> = {
    admin: 'Administrator',
    operasional: 'Operasional',
    mekanik: 'Mekanik',
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Dashboard Alat
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Selamat datang, {session.username}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {session.username}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {roleDisplayNames[session.role] || session.role}
                </p>
              </div>
              <form action={logout}>
                <Button type="submit" variant="outline">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8">
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              Dashboard {roleDisplayNames[session.role] || session.role}
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
              Halaman ini khusus untuk role: <span className="font-semibold text-blue-600 dark:text-blue-400">{session.role}</span>
            </p>
            <div className="max-w-md mx-auto p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                User ID: <span className="font-mono">{session.id}</span>
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                Username: <span className="font-mono">{session.username}</span>
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                Role: <span className="font-mono">{session.role}</span>
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                Login Time: <span className="font-mono">{new Date(session.iat * 1000).toLocaleString('id-ID')}</span>
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                Expires: <span className="font-mono">{new Date(session.exp * 1000).toLocaleString('id-ID')}</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add dashboard page

Implement protected dashboard page with role-based welcome message,
user info display, session details, and logout functionality.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Create Middleware for Route Protection

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware**

Create `middleware.ts` in project root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;

  // Protected routes
  const isProtectedRoute = path.startsWith('/dashboard');
  const isLoginRoute = path.startsWith('/login');

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing protected route with invalid token, redirect to login
  if (isProtectedRoute && token) {
    const session = verifyToken(token);
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If accessing login page with valid token, redirect to dashboard
  if (isLoginRoute && token) {
    const session = verifyToken(token);
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login/:path*'],
};
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add route protection middleware

Implement middleware to protect dashboard routes and handle login redirects.
Validates JWT tokens and manages route access control.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Update Root Layout to Use Shadcn Button

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Check if button component exists**

Run: `ls components/ui/button.tsx`

Expected: File exists

- [ ] **Step 2: Verify button component is properly configured**

Read `components/ui/button.tsx` to ensure it's properly set up.

- [ ] **Step 3: No commit needed**

Button component already exists from project initialization.

---

## Task 14: Test Complete Authentication Flow

**Files:**
- No file changes

- [ ] **Step 1: Start development server**

Run: `npm run dev`

Expected: Server starts on http://localhost:3000

- [ ] **Step 2: Test accessing dashboard without login**

Action: Open browser and navigate to http://localhost:3000/dashboard

Expected: Redirected to http://localhost:3000/login

- [ ] **Step 3: Test login with invalid credentials**

Action: Enter username "wrong" and password "wrong", click Login

Expected: Error message "Username atau password salah"

- [ ] **Step 4: Test login with admin credentials**

Action: Enter username "admin" and password "admin123", click Login

Expected: Redirect to /dashboard, shows "Dashboard Administrator" with admin user info

- [ ] **Step 5: Test logout**

Action: Click Logout button

Expected: Redirect to /login, cookie cleared

- [ ] **Step 6: Test login with operasional credentials**

Action: Login with username "operasional" and password "oper123"

Expected: Shows "Dashboard Operasional" with operasional role

- [ ] **Step 7: Test login with mekanik credentials**

Action: Logout, then login with username "mekanik" and password "mekanik123"

Expected: Shows "Dashboard Mekanik" with mekanik role

- [ ] **Step 8: Test session persistence**

Action: Refresh page while logged in

Expected: Stay on dashboard, session maintained

- [ ] **Step 9: Test accessing login while authenticated**

Action: Navigate to http://localhost:3000/login while logged in

Expected: Redirected to /dashboard

- [ ] **Step 10: Stop development server**

Action: Press Ctrl+C in terminal

- [ ] **Step 11: Final commit**

```bash
git add -A
git commit -m "test: complete authentication flow testing

Verified all authentication scenarios:
- Protected route redirects
- Invalid credentials handling
- Successful login for all 3 roles
- Logout functionality
- Session persistence
- Login redirect when authenticated

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 15: Update Home Page to Link to Login

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update home page**

Replace content of `app/page.tsx` with:

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
          Dashboard Alat
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          Sistem manajemen alat dengan role-based access control
        </p>
        <Link href="/login">
          <Button size="lg" className="w-full sm:w-auto">
            Login ke Dashboard
          </Button>
        </Link>
        <div className="mt-12 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Fitur
          </h2>
          <ul className="text-left space-y-2 text-zinc-600 dark:text-zinc-400">
            <li>✓ Autentikasi aman dengan password hashing</li>
            <li>✓ Session management dengan JWT</li>
            <li>✓ Role-based access control (3 role)</li>
            <li>✓ Protected routes dengan middleware</li>
            <li>✓ Responsive design dengan Tailwind CSS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 3: Test updated home page**

Run: `npm run dev`

Action: Open http://localhost:3000

Expected: Shows home page with "Login ke Dashboard" button

- [ ] **Step 4: Test login link**

Action: Click "Login ke Dashboard" button

Expected: Navigates to /login

- [ ] **Step 5: Stop dev server**

Action: Press Ctrl+C

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update home page with login link

Replace default Next.js page with custom landing page featuring
login button and feature list for the authentication system.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Summary

This implementation plan creates a complete authentication system with:

1. **Database Layer** (Tasks 4-6): PostgreSQL connection, users table, seed data with bcrypt-hashed passwords
2. **Auth Utilities** (Task 7): Password hashing, JWT tokens, cookie management, user queries
3. **Login Flow** (Tasks 8-9): Server action with validation, responsive UI with error handling
4. **Dashboard** (Tasks 10-11): Protected page showing role-based content, logout functionality
5. **Security** (Task 12): Middleware for route protection and token validation
6. **UX** (Task 15): Updated home page with login navigation

All 3 roles (admin, operasional, mekanik) can login and see their respective dashboard pages.
