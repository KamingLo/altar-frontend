'use server';

import { apiClient } from '@/lib/api/client';

export type AsdosListItem = {
  id_asdos: string;
  username: string;
  nim: string;
};

export type KoorListItem = {
  id_koor: string;
  username: string;
  nip: string;
};

export type UserListItem = {
  id: string;
  username: string;
  email: string;
};

export type AsdosDetail = {
  id: string;
  user_id: string;
  nim: string;
  phone_number: string;
  user: { username: string; email: string };
};

export async function getAsdosList(page = 1, search = '', limit = 10) {
  return apiClient.get<AsdosListItem[]>(
    `/asdos?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    { auth: true, cache: 'no-store' },
  );
}

export async function getKoorList(page = 1, search = '') {
  return apiClient.get<KoorListItem[]>(
    `/koor?page=${page}&search=${encodeURIComponent(search)}`,
    { auth: true, cache: 'no-store' },
  );
}

export async function getUserList(page = 1, search = '') {
  return apiClient.get<UserListItem[]>(
    `/users?page=${page}&search=${encodeURIComponent(search)}`,
    { auth: true, cache: 'no-store' },
  );
}

export async function getAsdosDetail(id: string) {
  return apiClient.get<AsdosDetail>(`/asdos/${id}`, { auth: true, cache: 'no-store' });
}

export async function createAsdosAccount(data: {
  username: string;
  email: string;
  nim: string;
  phone_number: string;
}) {
  // Step 1: buat user
  const userRes = await apiClient.post(
    '/users',
    { username: data.username, email: data.email },
    { auth: true },
  );
  if (!userRes.success) return { success: false, message: userRes.message };

  // Step 2: cari user yang baru dibuat by email
  const searchRes = await apiClient.get<UserListItem[]>(
    `/users?search=${encodeURIComponent(data.email)}`,
    { auth: true, cache: 'no-store' },
  );
  if (!searchRes.success || !searchRes.data?.length) {
    return { success: false, message: 'Gagal menemukan akun yang baru dibuat.' };
  }
  const user = searchRes.data.find(
    (u) => u.email.toLowerCase() === data.email.toLowerCase(),
  );
  if (!user) return { success: false, message: 'Akun baru tidak ditemukan setelah dibuat.' };

  // Step 3: assign role asdos
  const asdosRes = await apiClient.post(
    '/asdos',
    { user_id: user.id, nim: data.nim, phone_number: data.phone_number },
    { auth: true },
  );
  return {
    success: asdosRes.success,
    message: asdosRes.success ? 'Akun Asdos berhasil dibuat.' : asdosRes.message,
  };
}

export async function createKoorAccount(data: {
  username: string;
  email: string;
  nip: string;
}) {
  // Step 1: buat user
  const userRes = await apiClient.post(
    '/users',
    { username: data.username, email: data.email },
    { auth: true },
  );
  if (!userRes.success) return { success: false, message: userRes.message };

  // Step 2: cari user yang baru dibuat by email
  const searchRes = await apiClient.get<UserListItem[]>(
    `/users?search=${encodeURIComponent(data.email)}`,
    { auth: true, cache: 'no-store' },
  );
  if (!searchRes.success || !searchRes.data?.length) {
    return { success: false, message: 'Gagal menemukan akun yang baru dibuat.' };
  }
  const user = searchRes.data.find(
    (u) => u.email.toLowerCase() === data.email.toLowerCase(),
  );
  if (!user) return { success: false, message: 'Akun baru tidak ditemukan setelah dibuat.' };

  // Step 3: assign role koordinator
  const koorRes = await apiClient.post(
    '/koor',
    { user_id: user.id, nip: data.nip },
    { auth: true },
  );
  return {
    success: koorRes.success,
    message: koorRes.success ? 'Akun Koordinator berhasil dibuat.' : koorRes.message,
  };
}

export async function updateAsdos(id: string, data: { nim: string; phone_number: string }) {
  const res = await apiClient.patch(`/asdos/${id}`, data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function updateKoor(id: string, data: { nip: string }) {
  const res = await apiClient.patch(`/koor/${id}`, data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deleteAsdos(id: string) {
  const res = await apiClient.delete(`/asdos/${id}`, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deleteKoor(id: string) {
  const res = await apiClient.delete(`/koor/${id}`, { auth: true });
  return { success: res.success, message: res.message };
}

export async function createUser(data: { username: string; email: string }) {
  const res = await apiClient.post('/users/', data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function assignKoor(data: { user_id: string; nip: string }) {
  const res = await apiClient.post('/koor', data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function assignAsdos(data: { user_id: string; nim: string; phone_number: string }) {
  const res = await apiClient.post('/asdos', data, { auth: true });
  return { success: res.success, message: res.message };
}
