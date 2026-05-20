'use server';

import { apiClient } from '@/lib/api/client';

export interface AsdosSummary {
  id_asdos: string;
  username: string;
  nim: string;
}

export interface UserSummary {
  id: string;
  username: string;
  email: string;
}

export interface CreateAsdosPayload {
  username: string;
  email: string;
  nim: string;
  phone_number: string;
}

export async function getAsdosList() {
  return apiClient.get<AsdosSummary[]>('/asdos', { auth: true });
}


export async function createAsdos(payload: CreateAsdosPayload) {
  const userRes = await apiClient.post('/users/', {
    username: payload.username,
    email: payload.email,
    password: 'TemporaryPassword123!',
  }, { auth: true });

  if (!userRes.success) {
    return { success: false, message: userRes.message || 'Gagal membuat akun user' };
  }

  const searchRes = await apiClient.get<UserSummary[]>(`/users/?search=${payload.email}`, { auth: true });

  const newUser = searchRes.data?.find(u => u.email.toLowerCase() === payload.email.toLowerCase());

  if (!newUser?.id) {
    return { success: false, message: 'User berhasil dibuat, tapi gagal mengambil ID untuk registrasi asdos' };
  }

  const asdosRes = await apiClient.post('/asdos/', {
    user_id: newUser.id,
    nim: payload.nim,
    phone_number: payload.phone_number,
  }, { auth: true });

  return asdosRes;
}
