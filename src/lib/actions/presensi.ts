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
  link_video?: string;
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
  menggantikan: boolean;
  link_video?: string;
}

export async function submitCheckIn(payload: CheckInPayload) {
  return apiClient.post<PresensiResponseDTO>('/presensi/check-in', payload, { auth: true });
}

export async function submitCheckOut(payload: CheckOutPayload) {
  return apiClient.post<PresensiResponseDTO>('/presensi/check-out', payload, { auth: true });
}

export async function getMyPresensi() {
  return apiClient.get<PresensiResponseDTO[]>('/presensi/me', { auth: true, cache: 'no-store' });
}
