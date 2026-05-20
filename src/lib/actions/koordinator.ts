'use server';

import { apiClient } from '@/lib/api/client';

type QrTokenPayload =
  | string
  | {
      token?: string;
      qr_token?: string;
      access_token?: string;
    };

function extractQrToken(data: QrTokenPayload | null | undefined): string {
  if (!data) return '';
  if (typeof data === 'string') return data;
  return data.token ?? data.qr_token ?? data.access_token ?? '';
}

export async function setKioskPIN(pin: string) {
  const res = await apiClient.post('/koor/kiosk/pin/', { pin }, { auth: true });
  return { success: res.success, message: res.message };
}

export async function verifyKioskPIN(pin: string) {
  const res = await apiClient.post('/koor/kiosk/verify/', { pin }, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deactivateKiosk() {
  const res = await apiClient.post('/koor/kiosk/deactivate/', {}, { auth: true });
  return { success: res.success, message: res.message };
}

export async function generateQRToken() {
  const res = await apiClient.get<QrTokenPayload>('/koor/kiosk/generate-qr/', {
    auth: true,
    cache: 'no-store',
  });
  const token = extractQrToken(res.data);
  return {
    success: res.success && !!token,
    message: res.message || (token ? '' : 'Gagal membuat token QR.'),
    token,
  };
}

export async function getKioskStatus() {
  const res = await apiClient.get<{
    is_active?: boolean;
    active?: boolean;
    has_pin?: boolean;
    pin_set?: boolean;
  }>('/koor/kiosk/', { auth: true, cache: 'no-store' });

  if (!res.success || !res.data) {
    return { success: false, isActive: false, hasPin: false, message: res.message };
  }

  const d = res.data;
  return {
    success: true,
    isActive: !!(d.is_active ?? d.active),
    hasPin: !!(d.has_pin ?? d.pin_set),
    message: res.message,
  };
}
