'use server';

import { cookies } from 'next/headers';
import { apiClient } from '@/lib/api/client';
import type { UserData } from '@/types/api';

interface LoginData {
  token: string;
}

export async function loginUser(payload: { email?: string; password?: string }) {
  const res = await apiClient.post<LoginData>('/auth/login', payload);

  if (!res.success || !res.data?.token) {
    return { success: false, message: res.message || 'Login gagal' };
  }

  const token = res.data.token;
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, 
  });

  const userRes = await apiClient.get<UserData>('/auth/me', { auth: true });

  return { 
    success: true, 
    message: res.message, 
    data: {
      token: token,
      user: userRes.success ? userRes.data : null
    }
  };
}

