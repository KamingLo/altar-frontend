'use server';

import { cookies } from 'next/headers';
import { apiClient } from '@/lib/api/client';
import { decodeJwtPayload } from '@/lib/auth/jwt';
import type { UserData } from '@/types/api';

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  const result = await apiClient.get<UserData>('/auth/me', { auth: true, cache: 'no-store' });

  // Supplement missing role IDs from JWT payload (handles cases where OAuth token
  // only returns one role from the API but the JWT itself encodes both)
  if (result.success && result.data) {
    const payload = decodeJwtPayload(token);
    console.log('[getSession] /auth/me data:', JSON.stringify(result.data));
    console.log('[getSession] JWT payload:', JSON.stringify(payload));
    if (payload) {
      if (!result.data.id_asisten && payload.id_asisten) {
        result.data.id_asisten = payload.id_asisten as string;
      }
      if (!result.data.id_koordinator && payload.id_koordinator) {
        result.data.id_koordinator = payload.id_koordinator as string;
      }
    }
    console.log('[getSession] final data:', JSON.stringify(result.data));
  }

  return result;
}

export async function setSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, 
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

