'use server';

import { apiClient } from '@/lib/api/client';

export interface LecturerItem {
  id: string;
  nama: string;
  nip: string;
  created_at: string;
  updated_at: string;
}

type PaginatedResponse<T> = { items: T[]; total: number; page: number; limit: number; total_page: number };

export async function getLecturerList(page = 1, search = '', limit = 10) {
  return apiClient.get<PaginatedResponse<LecturerItem>>(
    `/lecturers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    { auth: true, cache: 'no-store' },
  );
}

export async function createLecturer(data: { nama: string; nip: string }) {
  const res = await apiClient.post<LecturerItem>('/lecturers', data, { auth: true });
  return { success: res.success, message: res.message, data: res.data };
}

export async function updateLecturer(id: string, data: { nama: string; nip: string }) {
  const res = await apiClient.patch(`/lecturers/${id}`, data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deleteLecturer(id: string) {
  const res = await apiClient.delete(`/lecturers/${id}`, { auth: true });
  return { success: res.success, message: res.message };
}
