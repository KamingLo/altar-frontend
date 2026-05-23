'use server';

import { apiClient } from '@/lib/api/client';

export async function checkIsAsdos() {
  return apiClient.get('/auth/is-asdos', { auth: true, cache: 'no-store' });
}

export async function checkIsKoordinator() {
  return apiClient.get('/auth/is-koor', { auth: true, cache: 'no-store' });
}

