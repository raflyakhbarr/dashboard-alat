# Authentication System Design

**Date:** 2026-04-13
**Project:** Dashboard Alat
**Status:** Approved

## Overview

Sistem autentikasi login untuk dashboard dengan 3 role: admin, operasional, dan mekanik. Menggunakan PostgreSQL untuk penyimpanan user dan password hashing untuk keamanan.

## Requirements

- Login dengan username dan password
- 3 user dengan role berbeda: admin, operasional, mekanik
- Dashboard yang sama untuk semua role (untuk tahap awal: halaman kosong dengan tulisan per role)
- Session management yang aman
- Logout functionality

## Architecture

### Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui components
- **Database:** PostgreSQL
- **Password Hashing:** bcrypt
- **Session Management:** JWT with HTTP-only cookies

### Login Flow

```
User → Login Page → Server Action → Verify PostgreSQL → Set HTTP-only Cookie → Redirect Dashboard
```

### Protected Route Flow

```
Dashboard Access → Middleware → Verify Cookie → Valid: Show Dashboard / Invalid: Redirect Login
```

## Database Schema

### Table: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operasional', 'mekanik')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Seed Data

```sql
INSERT INTO users (username, password, role) VALUES
  ('admin', '$2b$10$...', 'admin'),
  ('operasional', '$2b$10$...', 'operasional'),
  ('mekanik', '$2b$10$...', 'mekanik');
```

**Default Passwords:**
- admin: `admin123`
- operasional: `oper123`
- mekanik: `mekanik123`

## File Structure

```
app/
  ├── login/
  │   └── page.tsx              # Login page UI
  ├── dashboard/
  │   └── page.tsx              # Protected dashboard page
  └── layout.tsx                # Root layout
lib/
  ├── db.ts                     # PostgreSQL connection pool
  ├── auth.ts                   # Auth utilities (hash, verify, session)
  └── migrations/
      └── 001_create_users.sql  # Database migration script
middleware.ts                   # Route protection middleware
types/
  └── auth.ts                   # TypeScript types for auth
.env                            # Environment variables (DATABASE_URL, JWT_SECRET)
```

## Components

### 1. Login Page (`app/login/page.tsx`)

**Features:**
- Username input field
- Password input field
- Remember me checkbox
- Submit button
- Error message display
- Link to dashboard (if already logged in)

**Validations:**
- Username required
- Password required
- Client-side validation before submit

### 2. Server Action (`app/login/actions.ts`)

**Functions:**
- `login(username: string, password: string): Promise<{ success: boolean; error?: string }>`
  - Verify user exists in database
  - Compare password hash
  - Generate JWT token
  - Set HTTP-only cookie
  - Return success/error

### 3. Dashboard Page (`app/dashboard/page.tsx`)

**Features:**
- Protected by middleware
- Display user info (username, role)
- Welcome message per role
- Logout button
- Navigation to login (if not authenticated)

### 4. Auth Utilities (`lib/auth.ts`)

**Functions:**
- `hashPassword(password: string): Promise<string>`
- `verifyPassword(password: string, hash: string): Promise<boolean>`
- `generateToken(user: User): Promise<string>`
- `verifyToken(token: string): Promise<User | null>`
- `setAuthCookie(token: string): void`
- `clearAuthCookie(): void`
- `getSession(): Promise<User | null>`

### 5. Database Connection (`lib/db.ts`)

**Features:**
- PostgreSQL connection pool using `pg`
- Environment-based configuration
- Connection error handling
- Query helper functions

### 6. Middleware (`middleware.ts`)

**Logic:**
- Check if route is protected (/dashboard)
- Verify JWT token from cookie
- Redirect to login if invalid
- Redirect to dashboard if already on /login with valid token

## Security Measures

### Password Security
- Hashing with bcrypt (salt rounds: 10)
- Never store plain text passwords
- Password validation before hashing

### Session Security
- JWT tokens stored in HTTP-only cookies
- Cookies set with Secure flag (production)
- CSRF protection via Next.js built-in
- Token expiration: 7 days

### Database Security
- Parameterized queries to prevent SQL injection
- Least privilege database user
- Connection pooling to prevent connection exhaustion

### Input Validation
- Server-side validation for all inputs
- Sanitization of user input
- Length limits on username/password

## Dependencies

```json
{
  "dependencies": {
    "pg": "^8.11.3",              // PostgreSQL client
    "bcrypt": "^5.1.1",            // Password hashing
    "jsonwebtoken": "^9.0.2",      // JWT token generation
    "@types/pg": "^8.10.9",        // TypeScript types
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.5"
  }
}
```

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:123111@localhost:5432/dashboard_alat"
JWT_SECRET="your-secret-key-here-change-in-production"
```

## Error Handling

### Login Errors
- Invalid credentials
- Database connection errors
- User not found
- Password mismatch

### Dashboard Errors
- Unauthorized access (redirect to login)
- Invalid token (redirect to login)
- Database errors (show error message)

## Testing Strategy

### Manual Testing Checklist
- [ ] Login with correct credentials for each role
- [ ] Login with incorrect credentials
- [ ] Access dashboard without login (should redirect)
- [ ] Logout functionality
- [ ] Session persistence across page refreshes
- [ ] Token expiration handling

### Test Credentials
- admin / admin123
- operasional / oper123
- mekanik / mekanik123

## Future Enhancements

- [ ] Role-based menu/permissions on dashboard
- [ ] Password reset functionality
- [ ] User profile management
- [ ] Activity logging
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Rate limiting for login attempts
- [ ] Account lockout after failed attempts

## Implementation Plan

See separate implementation plan document for detailed step-by-step implementation.
