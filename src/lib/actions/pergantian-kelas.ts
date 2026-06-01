'use server';

import { apiClient } from '@/lib/api/client';
import type { SubstituteSessionDetail } from '@/types/api';

export type SubstitutionStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

type SubstitutionListParams = {
  status?: SubstitutionStatus;
  page?: number;
  limit?: number;
};

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

export async function getSubstitutionDetail(id: string) {
  return apiClient.get<SubstituteSessionDetail>(`/substitute-sessions/${id}`, {
    auth: true,
    cache: 'no-store',
  });
}

export async function getMySubstitutions() {
  return apiClient.get<{ items: SubstituteSessionDetail[]; total: number }>(
    '/substitute-sessions/me',
    {
      auth: true,
      cache: 'no-store',
    }
  );
}

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
  const errorDetail =
    typeof res.error === 'string'
      ? res.error
      : res.error instanceof Error
        ? res.error.message
        : '';

  return {
    success: res.success,
    message: res.success ? res.message : errorDetail || res.message,
    data: res.data as SubstituteSessionDetail | undefined,
  };
}

export async function deleteSubstitution(id: string) {
  const res = await apiClient.delete(`/substitute-sessions/${id}`, { auth: true });
  return { success: res.success, message: res.message };
}

export async function updateSubstitutionStatus(
  id: string,
  data: { status: 'VERIFIED' | 'REJECTED'; coordinator_reason?: string | null },
) {
  const res = await apiClient.patch(`/substitute-sessions/${id}/status`, data, { auth: true });
  return { success: res.success, message: res.message };
}

