'use server';

import { apiClient } from '@/lib/api/client';

export async function resetPasswordAction(data: {
  email: string;
  token: string;
  new_password: string;
}) {
  return apiClient.post('/auth/reset-password', data, { cache: 'no-store' });
}

