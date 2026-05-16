'use server';

import { apiClient } from '@/lib/api/client';
import type { JadwalTimelineParams, SessionTimeline, UnifiedJadwalResponse } from '@/types/api';

export interface SessionFromAPI {
  id_sesi: string;
  nama_kelas: string;
  mata_kuliah: string;
  ruangan: string;
  pengajar: string;
  waktu: string;
  tipe_jadwal: 'REGULAR' | 'PENGGANTI';
}

// Asdos: jadwal harian milik sendiri
export async function getSessionsByDate(date: string) {
  return apiClient.get<SessionFromAPI[]>(`/sessions/me?date=${date}`, {
    auth: true,
    cache: 'no-store',
  });
}

// Koordinator: semua sesi dalam rentang tanggal + semester
export async function getAllSessions(params: {
  id_semester: string;
  start_date?: string;
  end_date?: string;
}) {
  const q = new URLSearchParams({ id_semester: params.id_semester });
  if (params.start_date) q.set('start_date', params.start_date);
  if (params.end_date) q.set('end_date', params.end_date);
  return apiClient.get<{ total: number; items: SessionTimeline[] }>(
    `/sessions?${q.toString()}`,
    { auth: true, cache: 'no-store' },
  );
}

export type SessionBody = {
  id_kelas: string;
  id_mk: string;
  id_semester: string;
  id_ruangan: string;
  id_asdos1?: string | null;
  id_asdos2?: string | null;
  id_dosen?: string | null;
  opsi_hari: number; // 1=Senin … 6=Sabtu
  opsi_jam: number;  // 1-7 (lihat slot mapping di PANDUAN_API.txt)
};

// Koordinator: buat sesi jadwal baru
export async function createSession(data: SessionBody) {
  const res = await apiClient.post('/sessions', data, { auth: true });
  return { success: res.success, message: res.message };
}

// Koordinator: edit sesi jadwal
export async function updateSession(id: string, data: SessionBody) {
  const res = await apiClient.patch(`/sessions/${id}`, data, { auth: true });
  return { success: res.success, message: res.message };
}

// Koordinator: hapus sesi jadwal
export async function deleteSession(id: string) {
  const res = await apiClient.delete(`/sessions/${id}`, { auth: true });
  return { success: res.success, message: res.message };
}

// Asdos: timeline jadwal sendiri dalam date range
export async function getMyScheduleTimeline(params: JadwalTimelineParams) {
  const q = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
    id_semester: params.id_semester,
  });
  return apiClient.get<{
    start_date: string;
    end_date: string;
    id_semester: string;
    asdos_id: string;
    total: number;
    items: UnifiedJadwalResponse[];
  }>(`/jadwal/my-sessions?${q.toString()}`, { auth: true, cache: 'no-store' });
}

// Semua user: timeline semua jadwal (cek jadwal orang lain)
export async function getScheduleTimeline(params: JadwalTimelineParams) {
  const q = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
    id_semester: params.id_semester,
  });
  return apiClient.get<{
    start_date: string;
    end_date: string;
    id_semester: string;
    total: number;
    items: UnifiedJadwalResponse[];
  }>(`/jadwal/sessions?${q.toString()}`, { auth: true, cache: 'no-store' });
}
