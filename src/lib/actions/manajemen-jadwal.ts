'use server';

import {
  createSession,
  deleteSession,
  getAllSessions,
  updateSession,
  type SessionBody,
} from '@/lib/actions/jadwal';
import {
  getKelasList,
  getMKList,
  getRuanganList,
  getSemesterList,
} from '@/lib/actions/data-master';
import { getAsdosList } from '@/lib/actions/manajemen';
import { getLecturerList, type LecturerItem } from '@/lib/actions/lecturer';
import { deleteSubstitution } from '@/lib/actions/pergantian-kelas';
import { dedupeSessions, isSubstituteSessionId, isPenggantiTipe } from '@/lib/jadwal-utils';
import type { KelasItem, MataKuliahItem, RuanganItem, SemesterItem, SessionTimeline } from '@/types/api';
import type { AsdosListItem } from '@/lib/actions/manajemen';

const DROPDOWN_LIMIT = 500;

export type DropdownData = {
  kelasList: KelasItem[];
  mkList: MataKuliahItem[];
  ruanganList: RuanganItem[];
  semesterList: SemesterItem[];
  asdosList: AsdosListItem[];
  lecturerList: LecturerItem[];
};

function normalizeAsdosList(data: unknown): AsdosListItem[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: unknown }).items)) {
    return (data as { items: AsdosListItem[] }).items;
  }
  return [];
}

export async function fetchSessions(params: {
  id_semester: string;
  start_date?: string;
  end_date?: string;
}): Promise<{ success: boolean; message: string; items: SessionTimeline[] }> {
  const res = await getAllSessions(params);
  if (res.success && res.data) {
    return {
      success: true,
      message: res.message,
      items: dedupeSessions(res.data.items ?? []),
    };
  }
  return {
    success: false,
    message: res.message || 'Gagal memuat jadwal dari server.',
    items: [],
  };
}

export async function fetchDropdownData(): Promise<{
  success: boolean;
  message: string;
  data: DropdownData;
}> {
  const [kelasRes, mkRes, ruanganRes, semesterRes, asdosRes, lecturerRes] = await Promise.all([
    getKelasList(1, '', DROPDOWN_LIMIT),
    getMKList(1, '', DROPDOWN_LIMIT),
    getRuanganList(1, '', DROPDOWN_LIMIT),
    getSemesterList(1, '', DROPDOWN_LIMIT),
    getAsdosList(1, '', DROPDOWN_LIMIT),
    getLecturerList(1, '', DROPDOWN_LIMIT),
  ]);

  const failed = [kelasRes, mkRes, ruanganRes, semesterRes, asdosRes, lecturerRes].find(r => !r.success);
  if (failed) {
    return {
      success: false,
      message: failed.message || 'Gagal memuat data form dari server.',
      data: { kelasList: [], mkList: [], ruanganList: [], semesterList: [], asdosList: [], lecturerList: [] },
    };
  }

  return {
    success: true,
    message: '',
    data: {
      kelasList: kelasRes.data?.items ?? [],
      mkList: mkRes.data?.items ?? [],
      ruanganList: ruanganRes.data?.items ?? [],
      semesterList: semesterRes.data?.items ?? [],
      asdosList: normalizeAsdosList(asdosRes.data),
      lecturerList: lecturerRes.data?.items ?? [],
    },
  };
}

export async function fetchSemesters(): Promise<{
  success: boolean;
  message: string;
  items: SemesterItem[];
}> {
  const res = await getSemesterList(1, '', DROPDOWN_LIMIT);
  if (res.success && res.data) {
    return { success: true, message: res.message, items: res.data.items ?? [] };
  }
  return {
    success: false,
    message: res.message || 'Gagal memuat daftar semester.',
    items: [],
  };
}

export async function buatSesi(data: SessionBody) {
  const res = await createSession(data);
  return { success: res.success, message: res.message };
}

export async function editSesi(id: string, data: SessionBody, instanceDate?: string) {
  const res = await updateSession(id, data, instanceDate ?? data.tanggal);
  return { success: res.success, message: res.message };
}

export async function hapusSesi(
  id: string,
  instanceDate?: string,
  payload?: SessionBody,
  tipe?: string,
) {
  if (isSubstituteSessionId(id) || (tipe && isPenggantiTipe(tipe))) {
    const res = await deleteSubstitution(id);
    return { success: res.success, message: res.message };
  }
  const res = await deleteSession(id, instanceDate);
  return { success: res.success, message: res.message };
}

