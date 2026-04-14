'use server';

import { getUserByEmail, verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { LoginResult } from '@/types/auth';

export async function login(formData: FormData): Promise<LoginResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validation
  if (!email || !password) {
    return {
      success: false,
      error: 'Email dan password harus diisi',
    };
  }

  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Format email tidak valid',
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
    const user = await getUserByEmail(email);

    if (!user) {
      return {
        success: false,
        error: 'Email atau password salah',
      };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Email atau password salah',
      };
    }

    // Generate token and set cookie
    const token = generateToken({
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
    });

    await setAuthCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
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
