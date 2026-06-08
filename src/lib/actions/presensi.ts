'use server';

import { apiClient } from '@/lib/api/client';

export interface CheckInPayload {
  id_sesi: string;
  qr_token: string;
  id_sesi_pengganti?: string;
  id_asdos_rekan?: string;
  menggantikan?: boolean;
}

export interface CheckOutPayload {
  id_presensi: string;
  deskripsi_materi: string;
  qr_token: string;
}

export interface OnlineAttendancePayload {
  id_sesi: string;
  waktu_mulai: string;
  waktu_selesai: string; 
  deskripsi_materi: string;
  link_video: string;
  id_sesi_pengganti?: string;
  id_asdos_rekan?: string;
  menggantikan?: boolean;
}

export interface PresensiResponseDTO {
  id_presensi: string;
  id_sesi: string;
  id_sesi_pengganti?: string;
  nama_mata_kuliah: string;
  nama_kelas: string;
  nama_ruangan: string;
  nama_asdos: string;
  nama_asdos_rekan?: string;
  waktu_checkin: string;
  waktu_checkout?: string;
  tanggal_mengajar: string;
  deskripsi_materi?: string;
  tipe_absensi: string;
  is_verified: boolean;
  is_paid: boolean;
  menggantikan: boolean;
  forgot_checkout?: boolean;
  link_video?: string;
}

export interface RekapPresensiMeResponse {
  total_hadir: number;
  total_tidak_hadir: number;
}

export interface RekapPresensiItem {
  id_asdos: string;
  nama_asdos: string;
  total_hadir: number;
  total_tidak_hadir: number;
}

export async function submitCheckIn(payload: CheckInPayload) {
  return apiClient.post<PresensiResponseDTO>('/presensi/check-in', payload, { auth: true });
}

export async function submitCheckOut(payload: CheckOutPayload) {
  return apiClient.post<PresensiResponseDTO>('/presensi/check-out', payload, { auth: true });
}

export async function submitOnlineAttendance(payload: OnlineAttendancePayload) {
  return apiClient.post<PresensiResponseDTO>('/presensi/online', payload, { auth: true });
}

export async function getMyPresensi() {
  return apiClient.get<PresensiResponseDTO[]>('/presensi/me', { auth: true, cache: 'no-store' });
}

export async function getAllPresensi(isVerified?: boolean, tipeAbsensi?: string, idUser?: string, idSemester?: string) {
  const params: string[] = [];
  if (isVerified !== undefined) params.push(`is_verified=${isVerified}`);
  if (tipeAbsensi !== undefined) params.push(`tipe_absensi=${tipeAbsensi}`);
  if (idUser !== undefined) params.push(`id_user=${idUser}`);
  if (idSemester !== undefined) params.push(`id_semester=${idSemester}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return apiClient.get<PresensiResponseDTO[]>(`/presensi${query}`, { auth: true, cache: 'no-store' });
}

export async function getRekapPresensiMe(startDate: string, endDate: string) {
  return apiClient.get<RekapPresensiMeResponse>(
    `/presensi/rekap/me?start_date=${startDate}&end_date=${endDate}`,
    { auth: true, cache: 'no-store' }
  );
}

export async function getRekapPresensi(startDate: string, endDate: string, asdosId?: string) {
  const params = [`start_date=${startDate}`, `end_date=${endDate}`];
  if (asdosId) params.push(`asdos_id=${asdosId}`);
  return apiClient.get<RekapPresensiItem[]>(
    `/presensi/rekap?${params.join('&')}`,
    { auth: true, cache: 'no-store' }
  );
}

export async function updatePaymentStatus(ids: string[], isPaid: boolean) {
  return apiClient.patch<null>('/presensi/payment', { ids, is_paid: isPaid }, { auth: true });
}

export async function verifyPresensi(id: string, isVerified: boolean) {
  const res = await apiClient.patch<null>(`/presensi/${id}/verify`, { is_verified: isVerified }, { auth: true });
  return { success: res.success, message: res.message };
}
