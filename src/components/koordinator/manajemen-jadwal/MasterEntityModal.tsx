'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  createKelas, updateKelas, deleteKelas,
  createMK, updateMK, deleteMK,
  createRuangan, updateRuangan, deleteRuangan,
  createSemester, updateSemester, deleteSemester,
} from '@/lib/actions/data-master';
import { createLecturer, updateLecturer, deleteLecturer, type LecturerItem } from '@/lib/actions/lecturer';
import type { KelasItem, MataKuliahItem, RuanganItem, SemesterItem } from '@/types/api';

export type MasterResource = 'kelas' | 'mk' | 'ruangan' | 'lecturer' | 'semester';

export type MasterItem = KelasItem | MataKuliahItem | RuanganItem | LecturerItem | SemesterItem;

type Mode = 'create' | 'edit';
type Action = 'created' | 'updated' | 'deleted';

type Props = {
  open: boolean;
  mode: Mode;
  resource: MasterResource;
  initialData?: MasterItem | null;
  onClose: () => void;
  onSuccess: (action: Action, item: MasterItem | null) => void;
};

const RESOURCE_LABEL: Record<MasterResource, string> = {
  kelas: 'Kelas',
  mk: 'Mata Kuliah',
  ruangan: 'Ruangan',
  lecturer: 'Dosen',
  semester: 'Semester',
};

const TIPE_SEMESTER_OPTIONS = [
  { value: 'Ganjil', label: 'Ganjil' },
  { value: 'Genap', label: 'Genap' },
  { value: 'Pendek', label: 'Pendek' },
];

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] outline-none disabled:opacity-60';

export function MasterEntityModal({ open, mode, resource, initialData, onClose, onSuccess }: Props) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);

  const [isMd, setIsMd] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMd(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [form, setForm] = useState<Record<string, string>>(() =>
    initialFormFor(resource, mode === 'edit' ? initialData ?? null : null)
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t0 = setTimeout(() => {
      setClosing(false);
      setDragY(0);
      setError('');
      setConfirmDelete(false);
      setForm(initialFormFor(resource, mode === 'edit' ? initialData ?? null : null));
    }, 0);
    const id = setTimeout(() => setVisible(true), 10);
    return () => { clearTimeout(t0); clearTimeout(id); };
  }, [open, mode, resource, initialData]);

  const close = () => {
    setClosing(true);
    setVisible(false);
    setTimeout(() => {
      onClose();
      setClosing(false);
      setDragY(0);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  };
  const handleTouchEnd = () => { if (dragY > 100) close(); else setDragY(0); };

  const handleSubmit = async () => {
    setError('');
    const validation = validateForm(resource, form);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setIsSubmitting(true);
    const editingId = mode === 'edit' && initialData ? (initialData as { id: string }).id : null;
    const res = await submitResource(resource, mode, editingId, validation.payload);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message || `Gagal ${mode === 'create' ? 'membuat' : 'mengupdate'} ${RESOURCE_LABEL[resource]}.`);
      return;
    }

    // Untuk create: data dari response berisi item dengan id baru
    // Untuk edit: backend balikin item updated (atau null), kalau null caller bisa refetch
    const item = (res.data as MasterItem) ?? (mode === 'edit' && initialData ? buildOptimisticItem(resource, editingId!, validation.payload) : null);
    onSuccess(mode === 'create' ? 'created' : 'updated', item);
    close();
  };

  const handleDelete = async () => {
    if (!initialData) return;
    setError('');
    setIsSubmitting(true);
    const id = (initialData as { id: string }).id;
    const res = await deleteResource(resource, id);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message || `Gagal menghapus ${RESOURCE_LABEL[resource]}. Mungkin masih dipakai sesi lain.`);
      setConfirmDelete(false);
      return;
    }
    onSuccess('deleted', initialData);
    close();
  };

  if (!open) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-[80] transition-opacity duration-300 ${visible && !closing ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => { if (!isSubmitting) close(); }}
      />
      <div className="fixed inset-0 z-[81] flex items-end md:items-center justify-center pointer-events-none p-0 md:p-4">
        <div
          className={`w-full max-w-md bg-white rounded-t-[28px] md:rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-4rem)] md:max-h-[80vh] overflow-hidden pointer-events-auto transition-all duration-300 ${
            isMd ? (visible && !closing ? 'opacity-100 scale-100' : 'opacity-0 scale-95') : ''
          }`}
          style={
            !isMd
              ? {
                  transform: !visible || closing ? 'translateY(100%)' : `translateY(${dragY}px)`,
                  transition: !visible || closing || dragY === 0 ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
                }
              : {}
          }
        >
          <div
            className="w-full flex md:hidden items-center justify-center pt-4 pb-2 touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </div>

          <div className="px-5 pt-2 md:pt-6 pb-4 overflow-y-auto flex-1">
            <h2 className="text-[20px] font-extrabold text-[#1F2937]">
              {mode === 'create' ? `Buat ${RESOURCE_LABEL[resource]} Baru` : `Edit ${RESOURCE_LABEL[resource]}`}
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {mode === 'create'
                ? `Isi data ${RESOURCE_LABEL[resource].toLowerCase()} untuk ditambahkan ke daftar.`
                : `Perbarui informasi ${RESOURCE_LABEL[resource].toLowerCase()}.`}
            </p>

            <div className="space-y-4 mt-5">
              {renderFields(resource, form, setForm, isSubmitting)}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2.5 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            {mode === 'edit' && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus {RESOURCE_LABEL[resource]}
                  </button>
                ) : (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5">
                    <p className="text-xs text-rose-800 font-semibold mb-3 leading-relaxed">
                      Yakin hapus? Jika {RESOURCE_LABEL[resource].toLowerCase()} ini masih dipakai sesi lain, backend bakal tolak.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-xs active:scale-[0.98] disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 rounded-lg bg-rose-600 text-white font-bold text-xs active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Ya, Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 p-5 border-t border-slate-100 bg-white flex gap-3">
            <button
              type="button"
              onClick={close}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-[15px] active:scale-[0.98] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] shadow-md shadow-[#941C2F]/20 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'create' ? 'Buat' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function initialFormFor(resource: MasterResource, item: MasterItem | null): Record<string, string> {
  if (!item) {
    switch (resource) {
      case 'kelas':    return { nama_kelas: '', jurusan: '', jumlah_siswa: '' };
      case 'mk':       return { nama_mk: '', sks: '' };
      case 'ruangan':  return { nama_ruangan: '', lantai: '', kapasitas: '' };
      case 'lecturer': return { nama: '', nip: '' };
      case 'semester': return { tahun_ajaran: '', tipe_semester: 'Ganjil' };
    }
  }
  const i = item as unknown as Record<string, unknown>;
  switch (resource) {
    case 'kelas':
      return { nama_kelas: String(i.nama_kelas ?? ''), jurusan: String(i.jurusan ?? ''), jumlah_siswa: String(i.jumlah_siswa ?? '') };
    case 'mk':
      return { nama_mk: String(i.nama_mk ?? ''), sks: String(i.sks ?? '') };
    case 'ruangan':
      return { nama_ruangan: String(i.nama_ruangan ?? ''), lantai: String(i.lantai ?? ''), kapasitas: String(i.kapasitas ?? '') };
    case 'lecturer':
      return { nama: String(i.nama ?? ''), nip: String(i.nip ?? '') };
    case 'semester':
      return { tahun_ajaran: String(i.tahun_ajaran ?? ''), tipe_semester: String(i.tipe_semester ?? 'Ganjil') };
  }
}

function renderFields(
  resource: MasterResource,
  form: Record<string, string>,
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  disabled: boolean,
) {
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  switch (resource) {
    case 'kelas':
      return (
        <>
          <Field label="Nama Kelas">
            <input className={inputClass} placeholder="cth: TI A" value={form.nama_kelas} onChange={set('nama_kelas')} disabled={disabled} />
          </Field>
          <Field label="Jurusan">
            <input className={inputClass} placeholder="cth: Teknik Informatika" value={form.jurusan} onChange={set('jurusan')} disabled={disabled} />
          </Field>
          <Field label="Jumlah Siswa">
            <input className={inputClass} type="number" min={1} placeholder="cth: 40" value={form.jumlah_siswa} onChange={set('jumlah_siswa')} disabled={disabled} />
          </Field>
        </>
      );
    case 'mk':
      return (
        <>
          <Field label="Nama Mata Kuliah">
            <input className={inputClass} placeholder="cth: Basis Data" value={form.nama_mk} onChange={set('nama_mk')} disabled={disabled} />
          </Field>
          <Field label="SKS">
            <input className={inputClass} type="number" min={1} max={10} placeholder="cth: 3" value={form.sks} onChange={set('sks')} disabled={disabled} />
          </Field>
        </>
      );
    case 'ruangan':
      return (
        <>
          <Field label="Nama Ruangan">
            <input className={inputClass} placeholder="cth: Lab Komputer 1" value={form.nama_ruangan} onChange={set('nama_ruangan')} disabled={disabled} />
          </Field>
          <Field label="Lantai">
            <input className={inputClass} type="number" min={1} placeholder="cth: 9" value={form.lantai} onChange={set('lantai')} disabled={disabled} />
          </Field>
          <Field label="Kapasitas">
            <input className={inputClass} type="number" min={1} placeholder="cth: 40" value={form.kapasitas} onChange={set('kapasitas')} disabled={disabled} />
          </Field>
        </>
      );
    case 'lecturer':
      return (
        <>
          <Field label="Nama Dosen">
            <input className={inputClass} placeholder="cth: Dr. Budi Hartono" value={form.nama} onChange={set('nama')} disabled={disabled} />
          </Field>
          <Field label="NIP">
            <input className={inputClass} placeholder="cth: 198001012005011001" value={form.nip} onChange={set('nip')} disabled={disabled} />
          </Field>
        </>
      );
    case 'semester':
      return (
        <>
          <Field label="Tahun Ajaran">
            <input className={inputClass} placeholder="cth: 2026/2027" value={form.tahun_ajaran} onChange={set('tahun_ajaran')} disabled={disabled} />
          </Field>
          <Field label="Tipe Semester">
            <CustomSelect
              value={form.tipe_semester}
              onChange={v => setForm(f => ({ ...f, tipe_semester: v }))}
              options={TIPE_SEMESTER_OPTIONS}
              disabled={disabled}
            />
          </Field>
        </>
      );
  }
}

type ValidationResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; message: string };

function validateForm(resource: MasterResource, form: Record<string, string>): ValidationResult {
  const trim = (s: string) => (s ?? '').trim();
  const num = (s: string) => Number(s);
  const isPositiveInt = (n: number) => Number.isFinite(n) && Number.isInteger(n) && n > 0;

  switch (resource) {
    case 'kelas': {
      const nama_kelas = trim(form.nama_kelas);
      const jurusan = trim(form.jurusan);
      const jumlah_siswa = num(form.jumlah_siswa);
      if (!nama_kelas) return { ok: false, message: 'Nama kelas wajib diisi.' };
      if (!jurusan) return { ok: false, message: 'Jurusan wajib diisi.' };
      if (!isPositiveInt(jumlah_siswa)) return { ok: false, message: 'Jumlah siswa harus bilangan positif.' };
      return { ok: true, payload: { nama_kelas, jurusan, jumlah_siswa } };
    }
    case 'mk': {
      const nama_mk = trim(form.nama_mk);
      const sks = num(form.sks);
      if (!nama_mk) return { ok: false, message: 'Nama mata kuliah wajib diisi.' };
      if (!isPositiveInt(sks)) return { ok: false, message: 'SKS harus bilangan positif.' };
      return { ok: true, payload: { nama_mk, sks } };
    }
    case 'ruangan': {
      const nama_ruangan = trim(form.nama_ruangan);
      const lantai = num(form.lantai);
      const kapasitas = num(form.kapasitas);
      if (!nama_ruangan) return { ok: false, message: 'Nama ruangan wajib diisi.' };
      if (!isPositiveInt(lantai)) return { ok: false, message: 'Lantai harus bilangan positif.' };
      if (!isPositiveInt(kapasitas)) return { ok: false, message: 'Kapasitas harus bilangan positif.' };
      return { ok: true, payload: { nama_ruangan, lantai, kapasitas } };
    }
    case 'lecturer': {
      const nama = trim(form.nama);
      const nip = trim(form.nip);
      if (!nama) return { ok: false, message: 'Nama dosen wajib diisi.' };
      if (!nip) return { ok: false, message: 'NIP wajib diisi.' };
      return { ok: true, payload: { nama, nip } };
    }
    case 'semester': {
      const tahun_ajaran = trim(form.tahun_ajaran);
      const tipe_semester = trim(form.tipe_semester);
      if (!tahun_ajaran) return { ok: false, message: 'Tahun ajaran wajib diisi.' };
      if (!/^\d{4}\/\d{4}$/.test(tahun_ajaran)) return { ok: false, message: 'Format tahun ajaran: YYYY/YYYY (cth: 2026/2027).' };
      if (!['Ganjil', 'Genap', 'Pendek'].includes(tipe_semester)) return { ok: false, message: 'Tipe semester tidak valid.' };
      return { ok: true, payload: { tahun_ajaran, tipe_semester } };
    }
  }
}

type SubmitResult = { success: boolean; message: string; data?: unknown };

async function submitResource(
  resource: MasterResource,
  mode: Mode,
  editingId: string | null,
  payload: Record<string, unknown>,
): Promise<SubmitResult> {
  if (mode === 'create') {
    switch (resource) {
      case 'kelas':    return createKelas(payload as Parameters<typeof createKelas>[0]);
      case 'mk':       return createMK(payload as Parameters<typeof createMK>[0]);
      case 'ruangan':  return createRuangan(payload as Parameters<typeof createRuangan>[0]);
      case 'lecturer': return createLecturer(payload as Parameters<typeof createLecturer>[0]);
      case 'semester': return createSemester(payload as Parameters<typeof createSemester>[0]);
    }
  }
  if (!editingId) return { success: false, message: 'ID untuk edit tidak ditemukan.' };
  switch (resource) {
    case 'kelas':    return updateKelas(editingId, payload as Parameters<typeof updateKelas>[1]);
    case 'mk':       return updateMK(editingId, payload as Parameters<typeof updateMK>[1]);
    case 'ruangan':  return updateRuangan(editingId, payload as Parameters<typeof updateRuangan>[1]);
    case 'lecturer': return updateLecturer(editingId, payload as Parameters<typeof updateLecturer>[1]);
    case 'semester': return updateSemester(editingId, payload as Parameters<typeof updateSemester>[1]);
  }
}

async function deleteResource(resource: MasterResource, id: string): Promise<{ success: boolean; message: string }> {
  switch (resource) {
    case 'kelas':    return deleteKelas(id);
    case 'mk':       return deleteMK(id);
    case 'ruangan':  return deleteRuangan(id);
    case 'lecturer': return deleteLecturer(id);
    case 'semester': return deleteSemester(id);
  }
}

function buildOptimisticItem(resource: MasterResource, id: string, payload: Record<string, unknown>): MasterItem {
  const now = new Date().toISOString();
  const base = { id, created_at: now, updated_at: now };
  switch (resource) {
    case 'kelas':    return { ...base, ...payload } as KelasItem;
    case 'mk':       return { ...base, ...payload } as MataKuliahItem;
    case 'ruangan':  return { ...base, ...payload } as RuanganItem;
    case 'lecturer': return { ...base, ...payload } as LecturerItem;
    case 'semester': return { ...base, ...payload } as SemesterItem;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">{label}</label>
      {children}
    </div>
  );
}
