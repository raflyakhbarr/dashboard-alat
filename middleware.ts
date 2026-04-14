import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { type SessionUser } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.userId,
      email: decoded.email,
      nama: decoded.nama,
      role: decoded.role,
      iat: decoded.iat || 0,
      exp: decoded.exp || 0,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export const runtime = 'nodejs';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const path = request.nextUrl.pathname;

  // Protected routes
  const isProtectedRoute = path.startsWith('/dashboard');
  const isLoginRoute = path.startsWith('/login');
  const isRoot = path === '/';

  // Handle root path - redirect based on auth status
  if (isRoot) {
    if (token) {
      const session = verifyToken(token);
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    // Not logged in, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

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
  matcher: ['/dashboard/:path*', '/login/:path*', '/operasional/:path*', '/', '/peralatan_terminal/:path*', '/perencanaan_persediaan/:path*', '/fasilitas/:path*'],
};
