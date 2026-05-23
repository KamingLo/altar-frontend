'use server';

import { apiClient } from '@/lib/api/client';
import type { SubstituteSessionDetail } from '@/types/api';

export type SubstitutionStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

type SubstitutionListParams = {
  status?: SubstitutionStatus;
  page?: number;
  limit?: number;
};

// Koordinator/asdos: lihat request, bisa filter by status + pagination
export async function getAllSubstitutions(params?: SubstitutionStatus | SubstitutionListParams) {
  const normalized: SubstitutionListParams = typeof params === 'string' ? { status: params } : params ?? {};
  const queryParams = new URLSearchParams();
  if (normalized.status) queryParams.set('status', normalized.status);
  if (normalized.page) queryParams.set('page', String(normalized.page));
  if (normalized.limit) queryParams.set('limit', String(normalized.limit));
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiClient.get<{ items: SubstituteSessionDetail[]; total: number }>(
    `/substitute-sessions${query}`,
    { auth: true, cache: 'no-store' },
  );
}

// Semua role: lihat detail satu request
export async function getSubstitutionDetail(id: string) {
  return apiClient.get<SubstituteSessionDetail>(`/substitute-sessions/${id}`, {
    auth: true,
    cache: 'no-store',
  });
}

// Asdos: ajukan request pergantian kelas baru
// slot_option 1-7 â†’ 07:30-09:10, 09:30-11:10, 11:30-13:10, 13:30-15:10,
//                    15:30-17:10, 17:40-19:15, 19:30-21:00
export async function createSubstitution(data: {
  id_session: string;
  id_ruangan: string;
  id_dosen?: string | null;
  id_asdos1?: string | null;
  id_asdos2?: string | null;
  substitute_date: string;
  original_date: string;
  slot_option: number;
  reason: string;
}) {
  const res = await apiClient.post('/substitute-sessions', data, { auth: true });
  return { success: res.success, message: res.message, data: res.data as SubstituteSessionDetail | undefined };
}

// Asdos: batalkan request yang masih PENDING
export async function deleteSubstitution(id: string) {
  const res = await apiClient.delete(`/substitute-sessions/${id}`, { auth: true });
  return { success: res.success, message: res.message };
}

// Koordinator: approve (VERIFIED) atau reject (REJECTED) request
export async function updateSubstitutionStatus(
  id: string,
  data: { status: 'VERIFIED' | 'REJECTED'; coordinator_reason?: string | null },
) {
  const res = await apiClient.patch(`/substitute-sessions/${id}/status`, data, { auth: true });
  return { success: res.success, message: res.message };
}

