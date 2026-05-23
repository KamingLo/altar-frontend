'use server';

import { cookies } from 'next/headers';
import { apiClient } from '@/lib/api/client';
import type { UserData } from '@/types/api';

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  return apiClient.get<UserData>('/auth/me', { auth: true, cache: 'no-store' });
}

export async function setSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
  return { success: true };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  await apiClient.get('/auth/logout', { auth: true });
  cookieStore.delete('auth_token');
  cookieStore.delete('_gothic_session');
  return { success: true, message: 'Berhasil logout' };
}

