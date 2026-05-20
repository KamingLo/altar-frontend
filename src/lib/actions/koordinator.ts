'use server';

import { cookies } from 'next/headers';
import { apiClient } from '@/lib/api/client';

export async function setKioskPIN(pin: string) {
  return apiClient.post('/koor/kiosk/pin', { pin }, { auth: true });
}

export async function verifyKioskPIN(pin: string) {
  const res = await apiClient.post<{ token: string }>('/koor/kiosk/verify', { pin }, { auth: true });
  
  if (res.success && res.data?.token) {
    const cookieStore = await cookies();
    cookieStore.set('auth_token', res.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 hours for kiosk mode
    });
  }
  
  return res;
}

export async function deactivateKiosk() {
  const res = await apiClient.post<{ token: string }>('/koor/kiosk/deactivate', {}, { auth: true });
  
  if (res.success && res.data?.token) {
    const cookieStore = await cookies();
    cookieStore.set('auth_token', res.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days back to normal
    });
  }
  
  return res;
}

export async function generateQRToken() {
  // We use auth: true because the cookie should have been updated to the kiosk token
  return apiClient.get<{ qr_token: string }>('/koor/kiosk/generate-qr', { auth: true });
}
