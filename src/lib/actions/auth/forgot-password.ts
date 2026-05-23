'use server';

import { apiClient } from '@/lib/api/client';

export async function forgotPassword(email: string) {
  return apiClient.post('/auth/forgot-password', { email }, { cache: 'no-store' });
}

