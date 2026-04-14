export type UserRole = 'admin' | 'operasional' | 'mekanik' | 'operator';

export interface User {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  nama: string;
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
