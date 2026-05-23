'use server';

import { apiClient } from '@/lib/api/client';

export async function sendOtp(payload: { email: string }) {
  return apiClient.post('/auth/otp', payload);
}

export async function registerUser(payload: {
  email?: string;
  username?: string;
  password?: string;
  otp_code?: string;
}) {
  return apiClient.post('/auth/register', payload);
}

