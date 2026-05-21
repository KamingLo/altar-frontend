'use server';

import { apiClient } from '@/lib/api/client';
import type { KelasItem, MataKuliahItem, RuanganItem, SemesterItem } from '@/types/api';

type PaginatedResponse<T> = { items: T[]; total: number; page: number; limit: number; total_page: number };

export async function getKelasList(page = 1, search = '', limit = 10) {
  return apiClient.get<PaginatedResponse<KelasItem>>(
    `/classes?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    { auth: true, cache: 'no-store' },
  );
}

export async function createKelas(data: { nama_kelas: string; jurusan: string; jumlah_siswa: number }) {
  const res = await apiClient.post<KelasItem>('/classes', data, { auth: true });
  return { success: res.success, message: res.message, data: res.data };
}

export async function updateKelas(id: string, data: { nama_kelas: string; jurusan: string; jumlah_siswa: number }) {
  const res = await apiClient.patch(`/classes/${id}`, data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deleteKelas(id: string) {
  const res = await apiClient.delete(`/classes/${id}`, { auth: true });
  return { success: res.success, message: res.message };
}

export async function getMKList(page = 1, search = '', limit = 10) {
  return apiClient.get<PaginatedResponse<MataKuliahItem>>(
    `/courses?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    { auth: true, cache: 'no-store' },
  );
}

export async function createMK(data: { nama_mk: string; sks: number }) {
  const res = await apiClient.post<MataKuliahItem>('/courses', data, { auth: true });
  return { success: res.success, message: res.message, data: res.data };
}

export async function updateMK(id: string, data: { nama_mk: string; sks: number }) {
  const res = await apiClient.patch(`/courses/${id}`, data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deleteMK(id: string) {
  const res = await apiClient.delete(`/courses/${id}`, { auth: true });
  return { success: res.success, message: res.message };
}

export async function getRuanganList(page = 1, search = '', limit = 10) {
  return apiClient.get<PaginatedResponse<RuanganItem>>(
    `/rooms?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    { auth: true, cache: 'no-store' },
  );
}

export async function createRuangan(data: { nama_ruangan: string; lantai: number; kapasitas: number }) {
  const res = await apiClient.post<RuanganItem>('/rooms', data, { auth: true });
  return { success: res.success, message: res.message, data: res.data };
}

export async function updateRuangan(id: string, data: { nama_ruangan: string; lantai: number; kapasitas: number }) {
  const res = await apiClient.patch(`/rooms/${id}`, data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deleteRuangan(id: string) {
  const res = await apiClient.delete(`/rooms/${id}`, { auth: true });
  return { success: res.success, message: res.message };
}


export async function getSemesterList(page = 1, search = '', limit = 10) {
  return apiClient.get<PaginatedResponse<SemesterItem>>(
    `/semesters?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    { auth: true, cache: 'no-store' },
  );
}

export async function createSemester(data: { tahun_ajaran: string; tipe_semester: 'Ganjil' | 'Genap' | 'Pendek' }) {
  const res = await apiClient.post<SemesterItem>('/semesters', data, { auth: true });
  return { success: res.success, message: res.message, data: res.data };
}

export async function updateSemester(
  id: string,
  data: { tahun_ajaran: string; tipe_semester: 'Ganjil' | 'Genap' | 'Pendek' },
) {
  const res = await apiClient.patch(`/semesters/${id}`, data, { auth: true });
  return { success: res.success, message: res.message };
}

export async function deleteSemester(id: string) {
  const res = await apiClient.delete(`/semesters/${id}`, { auth: true });
  return { success: res.success, message: res.message };
}
