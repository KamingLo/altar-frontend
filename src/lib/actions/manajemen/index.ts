'use server';

import { apiClient } from '@/lib/api/client';

export type AsdosListItem = {
  id_asdos: string;
  username: string;
  nim: string;
  deactivated_at?: string | null;
};

export type KoorListItem = {
  id_koor: string;
  username: string;
  nip: string;
  deactivated_at?: string | null;
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

export async function getAsdosList(page = 1, search = '', limit = 10, includeInactive = false) {
  const q = `/asdos?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${includeInactive ? '&include_inactive=true' : ''}`;
  return apiClient.get<AsdosListItem[]>(q, { auth: true, cache: 'no-store' });
}

export async function getKoorList(page = 1, search = '', includeInactive = false) {
  const q = `/koor?page=${page}&search=${encodeURIComponent(search)}${includeInactive ? '&include_inactive=true' : ''}`;
  return apiClient.get<KoorListItem[]>(q, { auth: true, cache: 'no-store' });
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
  const userRes = await apiClient.post(
    '/users',
    { username: data.username, email: data.email },
    { auth: true },
  );
  if (!userRes.success) return { success: false, message: userRes.message };

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

  const asdosRes = await apiClient.post(
    '/asdos',
    { user_id: user.id, nim: data.nim, phone_number: data.phone_number },
    { auth: true },
  );
  return {
    success: asdosRes.success,
    message: asdosRes.success ? 'Akun Asisten Dosen berhasil dibuat.' : asdosRes.message,
  };
}

export async function createKoorAccount(data: {
  username: string;
  email: string;
  nip: string;
}) {
  const userRes = await apiClient.post(
    '/users',
    { username: data.username, email: data.email },
    { auth: true },
  );
  if (!userRes.success) return { success: false, message: userRes.message };

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

export async function activateAsdos(id: string) {
  const res = await apiClient.patch(`/asdos/${id}/activate`, undefined, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deactivateAsdos(id: string) {
  const res = await apiClient.patch(`/asdos/${id}/deactivate`, undefined, { auth: true });
  return { success: res.success, message: res.message };
}

export async function activateKoor(id: string) {
  const res = await apiClient.patch(`/koor/${id}/activate`, undefined, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deactivateKoor(id: string) {
  const res = await apiClient.patch(`/koor/${id}/deactivate`, undefined, { auth: true });
  return { success: res.success, message: res.message };
}

export async function createUser(data: { username: string; email: string }) {
  const res = await apiClient.post('/users/', data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function updateUser(id: string, data: { username: string; email: string }) {
  const res = await apiClient.patch(`/users/${id}`, data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deleteUser(id: string) {
  const res = await apiClient.delete(`/users/${id}`, { auth: true });
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

