export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
}

export type UserRole = 'asdos' | 'koordinator';

export interface UserData {
  id: string;
  email: string;
  id_asisten?: string | null;
  id_koordinator?: string | null;
}

export interface SubstituteSessionDetail {
  id: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  reason: string;
  coordinator_reason: string | null;
  substitute_date: string;
  original_date: string;
  time_slot: string;
  room: string;
  id_dosen: string | null;
  id_asdos1: string | null;
  id_asdos2: string | null;
  substitute_teacher: string;
  session?: {
    id_sesi: string;
    nama_kelas: string;
    mata_kuliah: string;
    ruangan: string;
    pengajar: string;
    waktu: string;
    tipe_jadwal: 'REGULAR' | 'PENGGANTI';
  };
  created_at: string;
  updated_at: string;
}

export interface KelasItem {
  id: string;
  nama_kelas: string;
  jurusan: string;
  jumlah_siswa: number;
  created_at: string;
  updated_at: string;
}

export interface MataKuliahItem {
  id: string;
  nama_mk: string;
  kode_mk: string;
  sks: number;
  created_at: string;
  updated_at: string;
}

export interface RuanganItem {
  id: string;
  nama_ruangan: string;
  lantai: number;
  kapasitas: number;
  created_at: string;
  updated_at: string;
}

export interface SemesterItem {
  id: string;
  tahun_ajaran: string;
  tipe_semester: 'Ganjil' | 'Genap' | 'Pendek';
  created_at: string;
  updated_at: string;
}

export interface SessionTimeline {
  id_sesi: string;
  tipe: 'REGULER' | 'REGULAR' | 'PENGGANTI' | 'SUBSTITUTE';
  tanggal: string;
  nama_kelas: string;
  mata_kuliah: string;
  ruangan: string;
  pengajar: string;
  waktu: string;
}

export interface UnifiedJadwalResponse {
  id_sesi: string;
  tipe: 'REGULER' | 'REGULAR' | 'PENGGANTI' | 'SUBSTITUTE';
  tanggal: string;
  nama_kelas: string;
  mata_kuliah: string;
  ruangan: string;
  pengajar: string;
  waktu: string;
}

export interface JadwalTimelineParams {
  start_date: string;
  end_date: string;
  id_semester: string;
}

