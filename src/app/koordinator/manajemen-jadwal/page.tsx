'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  Filter,
  LayoutList,
  Maximize2,
  Pencil,
  Plus,
  Search,
  Table2,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  buatSesi,
  editSesi,
  fetchDropdownData,
  fetchSemesters,
  fetchSessions,
  hapusSesi,
  type DropdownData,
} from '@/lib/actions/manajemen-jadwal';
import type { KelasItem, MataKuliahItem, RuanganItem, SemesterItem, SessionTimeline } from '@/types/api';
import type { AsdosListItem } from '@/lib/actions/manajemen';
import type { LecturerItem } from '@/lib/actions/lecturer';
import {
  HARI_OPTIONS,
  JAM_OPTIONS,
  opsiHariFromTanggal,
  opsiJamFromWaktu,
} from '@/lib/constants/jadwal-slots';
import {
  findByDisplayLabel,
  isPenggantiTipe,
  isSubstituteSessionId,
  normalizeSessionTipe,
  pengajarDisplayName,
  semesterLabel,
  sessionDateKey,
  sessionRowKey,
} from '@/lib/jadwal-utils';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { isSessionExpiredMessage } from '@/lib/auth/jwt';
import {
  MasterEntityModal,
  type MasterItem,
  type MasterResource,
} from '@/components/koordinator/manajemen-jadwal/MasterEntityModal';
import { AsdosPageShell, AsdosPageHeader, AsdosPrimaryButton } from '@/components/dashboard/asdos/AsdosUI';

function redirectIfSessionExpired(message: string | undefined): boolean {
  if (typeof window !== 'undefined' && isSessionExpiredMessage(message)) {
    window.location.href = '/auth/login?expired=1';
    return true;
  }
  return false;
}

const FILTER_TIPE_OPTIONS = [
  { value: 'ALL', label: 'Semua Tipe' },
  { value: 'REGULER', label: 'Reguler' },
  { value: 'PENGGANTI', label: 'Pengganti' },
];
const HARI_SELECT_OPTIONS = HARI_OPTIONS.map(h => ({ value: String(h.value), label: h.label }));
const JAM_SELECT_OPTIONS = JAM_OPTIONS.map(j => ({
  value: String(j.value),
  label: j.range,
}));

type TipeFilter = 'ALL' | 'REGULER' | 'PENGGANTI';

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(start: string, end: string) {
  const diff = parseLocalDate(end).getTime() - parseLocalDate(start).getTime();
  return Math.floor(diff / 86400000);
}

function toIsoDateFromDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}


function formatInputDate(iso: string) {
  if (!iso) return 'Pilih tanggal';
  return parseLocalDate(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

type SessionForm = {
  tanggal: string;
  id_kelas: string;
  id_mk: string;
  id_ruangan: string;
  opsi_hari: number;
  opsi_jam: number;
  id_asdos1: string;
  id_asdos2: string;
  id_dosen: string;
};

const emptyForm = (tanggal = ''): SessionForm => ({
  tanggal,
  id_kelas: '',
  id_mk: '',
  id_ruangan: '',
  opsi_hari: tanggal ? opsiHariFromTanggal(tanggal) : 1,
  opsi_jam: 1,
  id_asdos1: '',
  id_asdos2: '',
  id_dosen: '',
});

function DatePickerField({
  label,
  value,
  min,
  max,
  onChange,
  align = 'left',
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseLocalDate(value));
  const minDate = min ? parseLocalDate(min) : null;
  const maxDate = max ? parseLocalDate(max) : null;
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const offset = monthStart.getDay();
  const days = Array.from({ length: monthEnd.getDate() }, (_, i) =>
    new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1),
  );

  const changeMonth = (delta: number) => {
    setViewDate(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const pickDate = (date: Date) => {
    onChange(toIsoDateFromDate(date));
    setViewDate(date);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-[10px] md:text-[11px] font-bold text-slate-400/90 tracking-widest uppercase mb-1 ml-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-[52px] bg-white border border-slate-200 rounded-[14px] px-5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300 transition-all font-semibold flex items-center justify-between"
      >
        <span>{formatInputDate(value)}</span>
        <Calendar size={18} className="text-slate-400" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Tutup kalender"
            onClick={() => setOpen(false)}
          />
          <div className={`absolute top-[calc(100%+8px)] z-40 w-[280px] bg-white border border-slate-100 rounded-[20px] p-4 shadow-xl ${align === 'right' ? 'right-0' : 'left-0'}`}>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50"
              >
                <span className="sr-only">Bulan sebelumnya</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <p className="text-sm font-bold text-slate-800 capitalize">
                {viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50"
              >
                <span className="sr-only">Bulan berikutnya</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, index) => (
                <div key={`${day}-${index}`} className="h-7 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, index) => (
                <div key={index} />
              ))}
              {days.map(day => {
                const iso = toIsoDateFromDate(day);
                const selected = iso === value;
                const disabled = (minDate ? day < minDate : false) || (maxDate ? day > maxDate : false);
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickDate(day)}
                    className={`h-9 rounded-xl text-xs font-bold transition-all ${selected
                      ? 'bg-obsidian text-white'
                      : disabled
                        ? 'text-slate-300 cursor-not-allowed'
                        : sameMonth(day, viewDate)
                          ? 'text-slate-700 hover:bg-slate-50'
                          : 'text-slate-300'
                      }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">{label}</label>
      {children}
    </div>
  );
}

function FieldCRUD({
  label,
  onCreate,
  onEdit,
  canEdit,
  children,
}: {
  label: string;
  onCreate: () => void;
  onEdit: () => void;
  canEdit: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-1">
        <label className="text-[13px] font-bold text-[#1F2937]">{label}</label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCreate}
            className="text-[11px] font-bold text-crimson hover:bg-rose-50 active:scale-95 transition-all flex items-center gap-1 px-2 py-1 rounded-md"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Buat baru
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={!canEdit}
            className="text-slate-400 hover:text-crimson hover:bg-rose-50 active:scale-95 p-1 rounded-md disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
            aria-label={`Edit ${label}`}
            title={canEdit ? `Edit ${label} yang dipilih` : `Pilih ${label.toLowerCase()} dulu untuk edit`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function ManajemenJadwalPage() {
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [sessions, setSessions] = useState<SessionTimeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);


  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(() => toIsoDateFromDate(today));
  const [endDate, setEndDate] = useState(() => toIsoDateFromDate(addDays(today, 6)));

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipe, setFilterTipe] = useState<TipeFilter>('ALL');
  const [viewType, setViewType] = useState<'CARD' | 'TABLE'>('CARD');
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [tableDate, setTableDate] = useState(() => toIsoDateFromDate(today));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<SessionTimeline | null>(null);
  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [instructorType, setInstructorType] = useState<'DOSEN' | 'ASDOS'>('DOSEN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [mkList, setMkList] = useState<MataKuliahItem[]>([]);
  const [ruanganList, setRuanganList] = useState<RuanganItem[]>([]);
  const [asdosList, setAsdosList] = useState<AsdosListItem[]>([]);
  const [lecturerList, setLecturerList] = useState<LecturerItem[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<SessionTimeline | null>(null);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isDeleteClosing, setIsDeleteClosing] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const [isDeleteSemesterOpen, setIsDeleteSemesterOpen] = useState(false);
  const [isDeleteSemesterVisible, setIsDeleteSemesterVisible] = useState(false);
  const [isDeleteSemesterClosing, setIsDeleteSemesterClosing] = useState(false);
  const [isDeleteSemesterSubmitting, setIsDeleteSemesterSubmitting] = useState(false);
  const [deleteSemesterTargetId, setDeleteSemesterTargetId] = useState<string | null>(null);

  const [isMd, setIsMd] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMd(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [masterModal, setMasterModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'delete';
    resource: MasterResource;
    initialData: MasterItem | null;
  }>({ open: false, mode: 'create', resource: 'kelas', initialData: null });

  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetStartY, setSheetStartY] = useState(0);
  const [deleteSheetDragY, setDeleteSheetDragY] = useState(0);
  const [deleteSheetStartY, setDeleteSheetStartY] = useState(0);
  const [deleteSemesterSheetDragY, setDeleteSemesterSheetDragY] = useState(0);
  const [deleteSemesterSheetStartY, setDeleteSemesterSheetStartY] = useState(0);

  const [isSemesterSheetOpen, setIsSemesterSheetOpen] = useState(false);
  const [isSemesterSheetVisible, setIsSemesterSheetVisible] = useState(false);
  const [isSemesterSheetClosing, setIsSemesterSheetClosing] = useState(false);
  const [semesterSheetDragY, setSemesterSheetDragY] = useState(0);
  const [semesterSheetStartY, setSemesterSheetStartY] = useState(0);

  const initialSemesterLoaded = useRef(false);


  const maxEndDate = useMemo(() => toIsoDateFromDate(addDays(parseLocalDate(startDate), 6)), [startDate]);

  const handleViewTypeChange = (type: 'CARD' | 'TABLE') => {
    setViewType(type);
    if (type === 'TABLE') {
      setTableDate(startDate);
      setEndDate(startDate);
    } else {
      setEndDate(toIsoDateFromDate(addDays(parseLocalDate(startDate), 6)));
    }
  };

  const handleTableDateChange = (value: string) => {
    setTableDate(value);
    setStartDate(value);
    setEndDate(value);
  };

  const hasActiveSearch = Boolean(searchTerm.trim()) || filterTipe !== 'ALL';

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sessions.filter(s => {
      const matchSearch =
        !q ||
        s.mata_kuliah.toLowerCase().includes(q) ||
        s.nama_kelas.toLowerCase().includes(q) ||
        s.ruangan.toLowerCase().includes(q) ||
        s.pengajar.toLowerCase().includes(q) ||
        sessionDateKey(s.tanggal).includes(q);
      const matchTipe = filterTipe === 'ALL' || normalizeSessionTipe(s.tipe) === filterTipe;
      return matchSearch && matchTipe;
    });
  }, [sessions, searchTerm, filterTipe]);

  const timetableData = useMemo(() => {
    if (viewType !== 'TABLE') return null;
    const daySessions = filtered.filter(s => sessionDateKey(s.tanggal) === tableDate);
    const roomSet = new Set<string>();
    const lookup: Record<number, Record<string, SessionTimeline>> = {};
    daySessions.forEach(s => {
      if (s.ruangan) roomSet.add(s.ruangan);
      const slot = opsiJamFromWaktu(s.waktu);
      if (!lookup[slot]) lookup[slot] = {};
      lookup[slot][s.ruangan] = s;
    });
    const tableRooms = ruanganList.length > 0
      ? ruanganList.map(r => `${r.nama_ruangan} (Lantai ${r.lantai})`).sort((a, b) => a.localeCompare(b, 'id-ID'))
      : Array.from(roomSet).sort();
    return { jams: JAM_OPTIONS, rooms: tableRooms, lookup, daySessions };
  }, [filtered, viewType, tableDate, ruanganList]);

  const selectedSemester = semesters.find(s => s.id === selectedSemesterId);
  const deleteSemesterTarget = semesters.find(s => s.id === deleteSemesterTargetId);

  const semesterOptions = useMemo(
    () => semesters.map(s => ({ value: s.id, label: semesterLabel(s.tahun_ajaran, s.tipe_semester) })),
    [semesters],
  );
  const kelasOptions = useMemo(
    () => kelasList.map(k => ({ value: k.id, label: k.nama_kelas, description: `${k.jurusan} - ${k.jumlah_siswa} Siswa` })),
    [kelasList],
  );
  const mkOptions = useMemo(
    () => mkList.map(m => ({ value: m.id, label: m.nama_mk, description: `${m.kode_mk} - ${m.sks} SKS` })),
    [mkList],
  );
  const ruanganOptions = useMemo(
    () => ruanganList.map(r => ({ value: r.id, label: r.nama_ruangan, description: `Lantai ${r.lantai} - Kapasitas ${r.kapasitas}` })),
    [ruanganList],
  );
  const asdosOptions = useMemo(
    () => asdosList.map(a => ({ value: a.id_asdos, label: a.username, description: a.nim })),
    [asdosList],
  );
  const asdos2Options = useMemo(
    () => asdosOptions.filter(a => a.value !== form.id_asdos1),
    [asdosOptions, form.id_asdos1],
  );
  const lecturerOptions = useMemo(
    () => lecturerList.map(l => ({ value: l.id, label: l.nama, description: l.nip })),
    [lecturerList],
  );

  const conflictInfo = useMemo(() => {
    if (!isModalOpen || !form.tanggal || !form.opsi_jam) return { ruangan: null, pengajar: null };

    const sameDateAndJam = sessions.filter(s => {
      if (s.id_sesi === editingId) return false;
      return sessionDateKey(s.tanggal) === form.tanggal && opsiJamFromWaktu(s.waktu) === form.opsi_jam;
    });

    if (sameDateAndJam.length === 0) return { ruangan: null, pengajar: null };

    const selectedRuangan = form.id_ruangan ? ruanganList.find(r => r.id === form.id_ruangan) : null;
    const ruanganConflict = selectedRuangan
      ? (sameDateAndJam.find(s => s.ruangan.toLowerCase() === selectedRuangan.nama_ruangan.toLowerCase()) ?? null)
      : null;

    const selectedAsdos1 = form.id_asdos1 ? asdosList.find(a => a.id_asdos === form.id_asdos1) : null;
    const selectedAsdos2 = form.id_asdos2 ? asdosList.find(a => a.id_asdos === form.id_asdos2) : null;
    const selectedDosen = form.id_dosen ? lecturerList.find(l => l.id === form.id_dosen) : null;

    const pengajarConflict = sameDateAndJam.find(s => {
      const names = pengajarDisplayName(s.pengajar).toLowerCase().split(' & ').map(n => n.trim());
      if (selectedAsdos1 && names.includes(selectedAsdos1.username.toLowerCase())) return true;
      if (selectedAsdos2 && names.includes(selectedAsdos2.username.toLowerCase())) return true;
      if (selectedDosen && names.some(n => n.includes(selectedDosen.nama.toLowerCase()))) return true;
      return false;
    }) ?? null;

    return { ruangan: ruanganConflict, pengajar: pengajarConflict };
  }, [isModalOpen, form, sessions, ruanganList, asdosList, lecturerList, editingId]);

  const handleStartDateChange = (value: string) => {
    if (!value) return;
    setStartDate(value);
    if (!endDate || daysBetween(value, endDate) < 0) {
      setEndDate(value);
      return;
    }
    if (daysBetween(value, endDate) > 6) {
      setEndDate(toIsoDateFromDate(addDays(parseLocalDate(value), 6)));
    }
  };

  const handleEndDateChange = (value: string) => {
    if (!value) return;
    if (daysBetween(startDate, value) < 0) {
      setEndDate(startDate);
      return;
    }
    if (daysBetween(startDate, value) > 6) {
      setEndDate(maxEndDate);
      return;
    }
    setEndDate(value);
  };

  const refreshSessions = useCallback(async () => {
    if (!selectedSemesterId) return;
    setLoading(true);
    setFetchError(null);
    const res = await fetchSessions({
      id_semester: selectedSemesterId,
      start_date: startDate,
      end_date: endDate,
    });
    if (res.success) {
      setSessions(res.items);
    } else {
      setSessions([]);
      setFetchError(res.message || 'Gagal memuat sesi jadwal.');
      redirectIfSessionExpired(res.message);
    }
    setLoading(false);
    setIsInitialLoad(false);
  }, [selectedSemesterId, startDate, endDate]);

  const sortSemestersByNewest = (items: SemesterItem[]) => {
    return [...items].sort((a, b) => {
      
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA !== timeB && timeA > 0 && timeB > 0) {
        return timeB - timeA;
      }

      
      const yearCompare = (b.tahun_ajaran || '').localeCompare(a.tahun_ajaran || '');
      if (yearCompare !== 0) {
        return yearCompare;
      }

      
      const weight = { 'Pendek': 3, 'Genap': 2, 'Ganjil': 1 };
      const getWeight = (t: string) => weight[t as keyof typeof weight] || 0;
      return getWeight(b.tipe_semester || '') - getWeight(a.tipe_semester || '');
    });
  };

  const loadDropdownData = useCallback(async (): Promise<DropdownData | null> => {
    setDropdownLoading(true);
    const res = await fetchDropdownData();
    setDropdownLoading(false);
    if (!res.success) {
      if (redirectIfSessionExpired(res.message)) return null;
      return null;
    }
    setKelasList(res.data.kelasList);
    setMkList(res.data.mkList);
    setRuanganList(res.data.ruanganList);
    setAsdosList(res.data.asdosList);
    setLecturerList(res.data.lecturerList);
    return res.data;
  }, []);

  useEffect(() => {
    (async () => {
      const [res] = await Promise.all([
        fetchSemesters(),
        loadDropdownData(),
      ]);
      if (res.success && res.items.length) {
        const sorted = sortSemestersByNewest(res.items);
        setSemesters(sorted);
        if (!initialSemesterLoaded.current) {
          setSelectedSemesterId(sorted[0].id);
          initialSemesterLoaded.current = true;
        }
      } else {
        setIsInitialLoad(false);
        if (!res.success) redirectIfSessionExpired(res.message);
      }
    })();
  }, [loadDropdownData]);

  useEffect(() => {
    if (!selectedSemesterId) {
      const t = setTimeout(() => setSessions([]), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => refreshSessions(), 0);
    return () => clearTimeout(t);
  }, [selectedSemesterId, refreshSessions]);

  const refreshSemesters = useCallback(async () => {
    const res = await fetchSemesters();
    if (res.success) {
      const sorted = sortSemestersByNewest(res.items);
      setSemesters(sorted);
      return sorted;
    }
    return null;
  }, []);

  const handleDeleteSemesterOpen = (semesterId: string) => {
    if (!semesterId) return;
    setDeleteSemesterTargetId(semesterId);
    setIsDeleteSemesterClosing(false);
    setDeleteSemesterSheetDragY(0);
    setIsDeleteSemesterOpen(true);
    setTimeout(() => setIsDeleteSemesterVisible(true), 10);
  };

  const handleCloseDeleteSemester = () => {
    setIsDeleteSemesterClosing(true);
    setIsDeleteSemesterVisible(false);
    setTimeout(() => {
      setIsDeleteSemesterOpen(false);
      setIsDeleteSemesterClosing(false);
      setDeleteSemesterSheetDragY(0);
      setDeleteSemesterTargetId(null);
    }, 300);
  };

  const handleConfirmDeleteSemester = async () => {
    if (!deleteSemesterTargetId) return;
    setIsDeleteSemesterSubmitting(true);
    try {
      const res = await fetch(`/api/semesters/${deleteSemesterTargetId}`, { method: 'DELETE' }).then(r => r.json());
      setIsDeleteSemesterSubmitting(false);
      if (res.success) {
        const wasSelected = selectedSemesterId === deleteSemesterTargetId;
        handleCloseDeleteSemester();
        const refreshed = await refreshSemesters();
        if (wasSelected) {
          const next = refreshed?.find(s => s.id !== deleteSemesterTargetId);
          setSelectedSemesterId(next?.id ?? "");
        }
      }
    } catch {
      setIsDeleteSemesterSubmitting(false);
    }
  };

  const handleDeleteSemesterTouchStart = (e: React.TouchEvent) => setDeleteSemesterSheetStartY(e.touches[0].clientY);
  const handleDeleteSemesterTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - deleteSemesterSheetStartY;
    if (delta > 0) setDeleteSemesterSheetDragY(delta);
  };
  const handleDeleteSemesterTouchEnd = () => {
    if (deleteSemesterSheetDragY > 100) handleCloseDeleteSemester();
    else setDeleteSemesterSheetDragY(0);
  };

  const handleOpenSemesterSheet = () => {
    setIsSemesterSheetClosing(false);
    setSemesterSheetDragY(0);
    setIsSemesterSheetOpen(true);
    setTimeout(() => setIsSemesterSheetVisible(true), 10);
  };

  const handleCloseSemesterSheet = () => {
    setIsSemesterSheetClosing(true);
    setIsSemesterSheetVisible(false);
    setTimeout(() => {
      setIsSemesterSheetOpen(false);
      setIsSemesterSheetClosing(false);
      setSemesterSheetDragY(0);
    }, 300);
  };

  const handleSemesterSheetTouchStart = (e: React.TouchEvent) => setSemesterSheetStartY(e.touches[0].clientY);
  const handleSemesterSheetTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - semesterSheetStartY;
    if (delta > 0) setSemesterSheetDragY(delta);
  };
  const handleSemesterSheetTouchEnd = () => {
    if (semesterSheetDragY > 100) handleCloseSemesterSheet();
    else setSemesterSheetDragY(0);
  };

  const openMasterCreate = (resource: MasterResource) => {
    setMasterModal({ open: true, mode: 'create', resource, initialData: null });
  };

  const openMasterEdit = (resource: MasterResource, item: MasterItem | null) => {
    if (!item) {
      return;
    }
    setMasterModal({ open: true, mode: 'edit', resource, initialData: item });
  };

  const openMasterDelete = (resource: MasterResource, item: MasterItem | null) => {
    if (!item) {
      return;
    }
    setMasterModal({ open: true, mode: 'delete', resource, initialData: item });
  };

  const closeMasterModal = () =>
    setMasterModal(m => ({ ...m, open: false }));

  const handleMasterSuccess = async (
    action: 'created' | 'updated' | 'deleted',
    item: MasterItem | null,
  ) => {
    const resource = masterModal.resource;
    const actionLabel = action === 'created' ? 'dibuat' : action === 'updated' ? 'diperbarui' : 'dihapus';
    void actionLabel;

    if (resource === 'semester') {
      const refreshed = await refreshSemesters();
      if (action === 'created' && item) setSelectedSemesterId((item as { id: string }).id);
      if (action === 'deleted' && item) {
        const deletedId = (item as { id: string }).id;
        if (selectedSemesterId === deletedId) {
          const next = refreshed?.find(s => s.id !== deletedId);
          setSelectedSemesterId(next?.id ?? '');
        }
      }
      return;
    }

    await loadDropdownData();
    if (!item) return;
    const newId = (item as { id: string }).id;

    if (action === 'created') {
      switch (resource) {
        case 'kelas': setForm(f => ({ ...f, id_kelas: newId })); break;
        case 'mk': setForm(f => ({ ...f, id_mk: newId })); break;
        case 'ruangan': setForm(f => ({ ...f, id_ruangan: newId })); break;
        case 'lecturer': setForm(f => ({ ...f, id_dosen: newId, id_asdos1: '', id_asdos2: '' })); break;
      }
    } else if (action === 'deleted') {
      switch (resource) {
        case 'kelas': setForm(f => (f.id_kelas === newId ? { ...f, id_kelas: '' } : f)); break;
        case 'mk': setForm(f => (f.id_mk === newId ? { ...f, id_mk: '' } : f)); break;
        case 'ruangan': setForm(f => (f.id_ruangan === newId ? { ...f, id_ruangan: '' } : f)); break;
        case 'lecturer': setForm(f => (f.id_dosen === newId ? { ...f, id_dosen: '' } : f)); break;
      }
    }
  };

  const selectedKelasItem = useMemo(
    () => kelasList.find(k => k.id === form.id_kelas) ?? null,
    [kelasList, form.id_kelas],
  );
  const selectedMkItem = useMemo(
    () => mkList.find(m => m.id === form.id_mk) ?? null,
    [mkList, form.id_mk],
  );
  const selectedRuanganItem = useMemo(
    () => ruanganList.find(r => r.id === form.id_ruangan) ?? null,
    [ruanganList, form.id_ruangan],
  );
  const selectedLecturerItem = useMemo(
    () => lecturerList.find(l => l.id === form.id_dosen) ?? null,
    [lecturerList, form.id_dosen],
  );

  const buildPayload = () => ({
    id_kelas: form.id_kelas,
    id_mk: form.id_mk,
    id_semester: selectedSemesterId,
    id_ruangan: form.id_ruangan,
    tanggal: form.tanggal,
    opsi_hari: form.opsi_hari,
    opsi_jam: form.opsi_jam,
    id_asdos1: form.id_asdos1 || null,
    id_asdos2: form.id_asdos2 || null,
    id_dosen: form.id_dosen || null,
  });

  const prefillFromSession = (session: SessionTimeline, lists: {
    kelas: KelasItem[];
    mk: MataKuliahItem[];
    ruangan: RuanganItem[];
    asdos: AsdosListItem[];
    lecturers: LecturerItem[];
  }): SessionForm => {
    const tanggal = sessionDateKey(session.tanggal);
    const kelas = findByDisplayLabel(lists.kelas, session.nama_kelas, k => k.nama_kelas);
    const mk = findByDisplayLabel(lists.mk, session.mata_kuliah, m => m.nama_mk);
    const ruangan = findByDisplayLabel(lists.ruangan, session.ruangan, r => r.nama_ruangan);

    const pengajar = pengajarDisplayName(session.pengajar);
    let name1 = pengajar;
    let name2 = '';
    if (pengajar.includes(' & ')) {
      const parts = pengajar.split(' & ');
      name1 = parts[0].trim();
      name2 = parts[1].trim();
    }

    const dosen = lists.lecturers.find(l => l.nama.toLowerCase() === name1.toLowerCase());
    const asdos1 = dosen ? undefined : lists.asdos.find(a => a.username.toLowerCase() === name1.toLowerCase());
    const asdos2 = name2 ? lists.asdos.find(a => a.username.toLowerCase() === name2.toLowerCase()) : undefined;

    return {
      tanggal,
      id_kelas: kelas?.id ?? '',
      id_mk: mk?.id ?? '',
      id_ruangan: ruangan?.id ?? '',
      opsi_hari: opsiHariFromTanggal(tanggal),
      opsi_jam: opsiJamFromWaktu(session.waktu),
      id_asdos1: asdos1?.id_asdos ?? '',
      id_asdos2: asdos2?.id_asdos ?? '',
      id_dosen: dosen?.id ?? '',
    };
  };

  const handleFormTanggalChange = (tanggal: string) => {
    setForm(f => ({
      ...f,
      tanggal,
      opsi_hari: tanggal ? opsiHariFromTanggal(tanggal) : f.opsi_hari,
    }));
  };

  const handleOpenModal = async (type: 'add' | 'edit', session?: SessionTimeline) => {
    setModalType(type);
    setEditingId(session?.id_sesi ?? null);
    setEditingSession(session ?? null);
    setIsClosing(false);
    setSheetDragY(0);
    setIsModalOpen(true);
    setTimeout(() => setIsModalVisible(true), 10);

    if (type === 'add') {
      setForm(emptyForm(startDate));
      setInstructorType('DOSEN');
    } else if (session) {
      setForm(emptyForm(sessionDateKey(session.tanggal)));
    }

    const lists = await loadDropdownData();
    if (!lists) return;

    if (type === 'add') {
      setForm(emptyForm(startDate));
      setInstructorType('DOSEN');
    } else if (session) {
      const filled = prefillFromSession(session, {
        kelas: lists.kelasList,
        mk: lists.mkList,
        ruangan: lists.ruanganList,
        asdos: lists.asdosList,
        lecturers: lists.lecturerList,
      });
      setForm(filled);
      if (filled.id_dosen) {
        setInstructorType('DOSEN');
      } else {
        setInstructorType('ASDOS');
      }
    }
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setIsModalVisible(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
      setSheetDragY(0);
      setEditingId(null);
      setEditingSession(null);
    }, 300);
  };

  const handleSubmit = async () => {
    if (!selectedSemesterId) { return; }
    if (!form.tanggal) { return; }
    if (!form.id_kelas || !form.id_mk || !form.id_ruangan) { return; }
    if (modalType === 'edit' && !editingId) { return; }

    setIsSubmitting(true);
    const payload = buildPayload();
    const instanceDate =
      modalType === 'edit' && editingSession
        ? sessionDateKey(editingSession.tanggal)
        : undefined;
    const res =
      modalType === 'add'
        ? await buatSesi(payload)
        : await editSesi(editingId!, payload, instanceDate);
    setIsSubmitting(false);

    if (!res.success) {
      if (redirectIfSessionExpired(res.message)) return;
      return;
    }
    handleCloseModal();
    await refreshSessions();
  };

  const handleDeleteOpen = (session: SessionTimeline) => {
    setDeleteTarget(session);
    setIsDeleteClosing(false);
    setDeleteSheetDragY(0);
    setTimeout(() => setIsDeleteVisible(true), 10);
  };

  const handleCloseDelete = () => {
    setIsDeleteClosing(true);
    setIsDeleteVisible(false);
    setTimeout(() => {
      setDeleteTarget(null);
      setIsDeleteClosing(false);
      setDeleteSheetDragY(0);
    }, 300);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !selectedSemesterId) return;
    setIsDeleteSubmitting(true);

    const instanceDate = sessionDateKey(deleteTarget.tanggal);
    const isSubstitute =
      isSubstituteSessionId(deleteTarget.id_sesi) || isPenggantiTipe(deleteTarget.tipe);

    let deletePayload: Parameters<typeof hapusSesi>[2];
    if (!isSubstitute) {
      let lists = { kelasList, mkList, ruanganList, asdosList, lecturerList };
      if (!kelasList.length) {
        const loaded = await loadDropdownData();
        if (loaded) lists = { ...loaded, lecturerList: loaded.lecturerList };
      }
      const filled = prefillFromSession(deleteTarget, {
        kelas: lists.kelasList,
        mk: lists.mkList,
        ruangan: lists.ruanganList,
        asdos: lists.asdosList,
        lecturers: lists.lecturerList,
      });
      if (filled.id_kelas && filled.id_mk && filled.id_ruangan) {
        deletePayload = {
          id_kelas: filled.id_kelas,
          id_mk: filled.id_mk,
          id_semester: selectedSemesterId,
          id_ruangan: filled.id_ruangan,
          tanggal: instanceDate,
          opsi_hari: filled.opsi_hari,
          opsi_jam: filled.opsi_jam,
          id_asdos1: filled.id_asdos1 || null,
          id_asdos2: filled.id_asdos2 || null,
          id_dosen: filled.id_dosen || null,
        };
      }
    }

    const res = await hapusSesi(
      deleteTarget.id_sesi,
      instanceDate,
      deletePayload,
      deleteTarget.tipe,
    );
    setIsDeleteSubmitting(false);
    if (!res.success) {
      if (redirectIfSessionExpired(res.message)) return;
      return;
    }
    handleCloseDelete();
    await refreshSessions();
  };

  const handleTouchStart = (e: React.TouchEvent) => setSheetStartY(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - sheetStartY;
    if (delta > 0) setSheetDragY(delta);
  };
  const handleTouchEnd = () => {
    if (sheetDragY > 100) handleCloseModal();
    else setSheetDragY(0);
  };

  const handleDeleteTouchStart = (e: React.TouchEvent) => setDeleteSheetStartY(e.touches[0].clientY);
  const handleDeleteTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - deleteSheetStartY;
    if (delta > 0) setDeleteSheetDragY(delta);
  };
  const handleDeleteTouchEnd = () => {
    if (deleteSheetDragY > 100) handleCloseDelete();
    else setDeleteSheetDragY(0);
  };

  const selectClass =
    'w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:border-crimson focus:ring-1 focus:ring-crimson outline-none disabled:opacity-60';

  if (isInitialLoad) {
    return (
      <div className="relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 min-h-screen pb-24 md:pb-12 font-sans">

        <div className="mb-6">
          <div className="h-3.5 w-20 rounded-full mb-2.5 animate-shimmer"></div>
          <div className="h-8 w-64 rounded-xl mb-3 animate-shimmer"></div>
          <div className="h-4 w-96 max-w-full rounded-lg mb-4 animate-shimmer"></div>
        </div>


        <div className="mb-5 md:mb-6 flex flex-col md:flex-row gap-3 relative z-20 w-full justify-between items-stretch md:items-center">

          <div className="w-full sm:w-48 md:w-56 h-12 rounded-2xl animate-shimmer"></div>


          <div className="flex gap-3 flex-1 md:max-w-[420px] md:ml-auto w-full">
            <div className="flex-1 h-12 rounded-2xl animate-shimmer"></div>
            <div className="w-12 h-12 rounded-2xl animate-shimmer"></div>
          </div>
        </div>


        <div className="flex flex-col gap-4 lg:gap-6 items-start">
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="h-[52px] rounded-[14px] animate-shimmer" />
            <div className="h-[52px] rounded-[14px] animate-shimmer" />
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-center h-7 mb-2">
              <div className="h-3.5 w-40 rounded-md animate-shimmer"></div>
              <div className="h-6 w-16 rounded-md animate-shimmer"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`card-${i}`}
                  className="bg-white rounded-[12px] md:rounded-[32px] p-5 md:p-6 border border-slate-100 animate-shimmer space-y-6"
                >
                  <div className="h-5 w-2/3 rounded"></div>
                  <div className="h-3.5 w-1/2 rounded"></div>
                  <div className="h-20 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AsdosPageShell className="pb-24 md:pb-12" scrollTopBottom="bottom-44">

      <div className="shrink-0">
        <AsdosPageHeader
          eyebrow="Koordinator"
          title="Manajemen Jadwal"
          description="Kelola sesi jadwal mengajar per semester."
          className="!mb-2 md:!mb-5"
          action={
            <div className="relative shrink-0 flex flex-col sm:flex-row sm:items-end gap-3 z-30 w-full md:w-auto">
              
              <div className="hidden md:flex relative w-full sm:w-[200px] md:w-[220px] flex-col gap-[10px]">
                <div className="flex items-center justify-between w-full px-1">
                  <label className="block text-[11px] font-bold text-slate-400/90 tracking-widest uppercase">
                    Semester
                  </label>
                  <button
                    type="button"
                    onClick={() => openMasterCreate('semester')}
                    className="flex items-center gap-0.5 text-[11px] font-extrabold text-crimson hover:text-[#7a1727] hover:bg-rose-50 active:scale-95 transition-all px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                  >
                    <Plus className="w-3 h-3" strokeWidth={2.5} />
                    Buat
                  </button>
                </div>
                <CustomSelect
                  value={selectedSemesterId}
                  onChange={setSelectedSemesterId}
                  options={semesterOptions}
                  placeholder="Semester"
                  disabled={!semesters.length}
                  icon={<CalendarDays className="w-[18px] h-[18px]" />}
                  triggerClassName="rounded-2xl py-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                  onDeleteOption={handleDeleteSemesterOpen}
                />
              </div>

              
              <AsdosPrimaryButton
                type="button"
                onClick={() => handleOpenModal('add')}
                disabled={!selectedSemesterId}
                icon={<Plus className="w-5 h-5" strokeWidth={2.5} />}
                className="hidden md:flex py-3.5 px-6 text-[15px] h-[52px] items-center justify-center hover:scale-[1.03] hover:shadow-lg hover:shadow-crimson/30"
              >
                Buat Sesi Baru
              </AsdosPrimaryButton>
            </div>
          }
        />

        <div className="mb-6 md:mb-2 flex flex-col gap-2 relative z-20 w-full">
          <div className="flex flex-col md:flex-row md:items-end gap-3 w-full">
            <div className="flex flex-col sm:flex-row items-end gap-3 w-full md:w-auto shrink-0">
              <div className="flex flex-col w-full sm:w-auto">
                {viewType === 'TABLE' ? (
                  <div className="w-full sm:w-[200px]">
                    <DatePickerField label="Tanggal" value={tableDate} onChange={handleTableDateChange} />
                  </div>
                ) : (
                  <div className="flex gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-[190px] md:w-[200px]">
                      <DatePickerField label="Dari Tanggal" value={startDate} onChange={handleStartDateChange} />
                    </div>
                    <div className="w-full sm:w-[190px] md:w-[200px]">
                      <DatePickerField
                        label="Sampai Tanggal"
                        value={endDate}
                        min={startDate}
                        max={maxEndDate}
                        onChange={handleEndDateChange}
                        align="right"
                      />
                    </div>
                  </div>
                )}
                {viewType === 'CARD' && (
                  <p className="text-xs font-medium text-slate-400 mt-1.5 md:hidden">
                    Pilih rentang tanggal maksimal 7 hari.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full md:ml-auto md:w-auto md:max-w-[480px] items-center">
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <div className="flex bg-slate-100 p-0.5 rounded-xl">
                  {([
                    { type: 'CARD' as const, icon: <LayoutList size={15} />, label: 'Kartu' },
                    { type: 'TABLE' as const, icon: <Table2 size={15} />, label: 'Tabel' },
                  ]).map(({ type, icon, label }) => (
                    <button
                      key={type}
                      onClick={() => handleViewTypeChange(type)}
                      className={`h-[46px] flex items-center gap-1.5 px-3 rounded-[9px] text-xs font-semibold transition-all ${
                        viewType === type ? 'bg-white text-crimson shadow-sm' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {icon}{label}
                    </button>
                  ))}
                </div>
                {viewType === 'TABLE' && (
                  <button
                    onClick={() => setIsTableExpanded(true)}
                    className="hidden md:flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-crimson hover:border-crimson/30 transition-all active:scale-95"
                    title="Perluas tampilan tabel"
                  >
                    <Maximize2 size={16} />
                  </button>
                )}
              </div>

              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari MK, kelas, ruangan..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 outline-none text-sm font-medium text-slate-800 bg-white/95 placeholder-slate-400 focus:border-crimson focus:ring-2 focus:ring-crimson/15 transition-all"
                />
              </div>

              <div className="hidden md:block relative shrink-0">
                <CustomSelect
                  variant="icon"
                  align="right"
                  value={filterTipe}
                  onChange={v => setFilterTipe(v as TipeFilter)}
                  options={FILTER_TIPE_OPTIONS}
                  placeholder="Filter tipe"
                  icon={<Filter className="w-[18px] h-[18px]" />}
                  triggerClassName={filterTipe !== 'ALL' ? 'bg-red-50 border-crimson text-crimson' : ''}
                />
              </div>

              <div className="md:hidden flex bg-slate-100 p-0.5 rounded-[14px] shrink-0">
                {([
                  { type: 'CARD' as const, icon: <LayoutList size={15} /> },
                  { type: 'TABLE' as const, icon: <Table2 size={15} /> },
                ]).map(({ type, icon }) => (
                  <button
                    key={type}
                    onClick={() => handleViewTypeChange(type)}
                    className={`h-[46px] w-[46px] flex items-center justify-center rounded-[11px] transition-all ${
                      viewType === type ? 'bg-white text-crimson shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {viewType === 'CARD' && (
            <p className="hidden md:block text-xs font-medium text-slate-400">
              Pilih rentang tanggal maksimal 7 hari.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start">

        <div className="flex flex-col flex-1 min-w-0 w-full md:min-h-[320px]">

          <div className="space-y-6">
            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && viewType === 'TABLE' && timetableData && (
              timetableData.rooms.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <div className="h-3 border-b border-slate-100" />
                  <div className="overflow-auto max-h-[70vh]">
                    <table className="w-full">
                      <thead className="sticky top-0 z-20">
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <th className="px-3 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[110px] border-r border-slate-100">
                            Jam
                          </th>
                          {timetableData.rooms.map(room => (
                            <th key={room} className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[160px]">
                              {room}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {timetableData.jams.map(jam => (
                          <tr key={jam.value} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-3 py-3 border-r border-slate-100">
                              <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap font-mono">{jam.range}</span>
                            </td>
                            {timetableData.rooms.map(room => {
                              const s = timetableData.lookup[jam.value]?.[room];
                              if (!s) {
                                return (
                                  <td key={room} className="px-3 py-3 text-center">
                                    <span className="text-slate-200 text-sm">—</span>
                                  </td>
                                );
                              }
                              const isPengganti = isPenggantiTipe(s.tipe);
                              return (
                                <td key={room} className="px-2.5 py-2">
                                  <div className={`rounded-lg px-3 py-2.5 text-center ${isPengganti ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50 border border-slate-100'}`}>
                                    <p className="text-xs font-bold leading-snug line-clamp-2 text-slate-700">{s.mata_kuliah}</p>
                                    {s.nama_kelas && (
                                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{s.nama_kelas}</p>
                                    )}
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                      <p className="text-[10px] text-slate-400 truncate">{pengajarDisplayName(s.pengajar) || '-'}</p>
                                    </div>
                                    {isPengganti && (
                                      <span className="mt-1.5 inline-block text-[9px] font-bold uppercase tracking-wider text-crimson bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                        Pengganti
                                      </span>
                                    )}
                                    <div className="flex justify-center gap-1.5 mt-2 pt-1.5 border-t border-slate-100">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenModal('edit', s)}
                                        disabled={isPengganti}
                                        className="h-6 w-6 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:text-crimson hover:border-crimson/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        title={isPengganti ? 'Sesi pengganti tidak bisa diedit' : 'Edit sesi'}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteOpen(s)}
                                        className="h-6 w-6 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:text-crimson hover:border-rose-200 hover:bg-rose-50 active:scale-95 transition-all"
                                        title="Hapus sesi"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 md:p-12 border border-dashed border-slate-200 text-center shadow-sm">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <CalendarDays size={26} />
                  </div>
                  <p className="text-sm md:text-base font-semibold text-slate-700">Tidak ada sesi jadwal.</p>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Belum ada sesi pada tanggal ini.</p>
                </div>
              )
            )}

            {!loading && viewType === 'CARD' &&
              (() => {
                const grouped = filtered.reduce<Record<string, SessionTimeline[]>>((acc, s) => {
                  const key = sessionDateKey(s.tanggal);
                  acc[key] = [...(acc[key] || []), s];
                  return acc;
                }, {});
                const keys = Object.keys(grouped).sort();

                const formatDisplayDate = (iso: string) => {
                  if (!iso) return '-';
                  return parseLocalDate(iso).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                };

                const ScheduleCard = ({ s }: { s: SessionTimeline }) => {
                  const timePart = s.waktu.includes(', ') ? s.waktu.split(', ')[1] : s.waktu;
                  const isPengganti = isPenggantiTipe(s.tipe);
                  const mkInfo = findByDisplayLabel(mkList, s.mata_kuliah, m => m.nama_mk);
                  const kelasInfo = findByDisplayLabel(kelasList, s.nama_kelas, k => k.nama_kelas);
                  const ruanganInfo = findByDisplayLabel(ruanganList, s.ruangan, r => r.nama_ruangan);

                  return (
                    <section className="bg-white rounded-[12px] md:rounded-[32px] p-5 md:p-6 border border-slate-100 flex flex-col w-full">
                      <article className="flex flex-col flex-1 gap-5">
                        <div className="flex flex-col gap-1 w-full">
                          <h2 className="font-bold text-slate-900 leading-snug line-clamp-2 mb-1 text-sm md:text-base">
                            {s.mata_kuliah}
                          </h2>
                          {mkInfo && (
                            <p className="text-[11px] font-semibold text-slate-400">
                              {mkInfo.kode_mk} - {mkInfo.sks} SKS
                            </p>
                          )}
                          <p className="text-slate-500 font-medium text-[11px] md:text-xs">
                            {s.nama_kelas || 'Kelas tidak tersedia'}
                            {kelasInfo && ` - ${kelasInfo.jumlah_siswa} Siswa`}
                          </p>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-y-2.5 border-t border-slate-100 pt-3 md:grid-cols-2 md:gap-x-6 md:gap-y-4 md:border-t-0 md:pt-0">
                          <div className="flex flex-col gap-0.5 md:border-l-2 md:border-slate-100 md:pl-4">
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
                            <span className="font-bold text-slate-800 text-xs md:text-xs">{formatDisplayDate(sessionDateKey(s.tanggal))}</span>
                          </div>
                          <div className="flex flex-col gap-0.5 md:border-l-2 md:border-slate-100 md:pl-4">
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                            <span className="font-bold text-slate-800 text-xs md:text-xs">{timePart}</span>
                          </div>
                          <div className="flex flex-col gap-0.5 md:border-l-2 md:border-slate-100 md:pl-4">
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ruangan</span>
                            <span className="font-bold text-slate-800 text-xs md:text-xs">
                              {s.ruangan}
                              {ruanganInfo && ` - Kapasitas ${ruanganInfo.kapasitas}`}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5 md:border-l-2 md:border-slate-100 md:pl-4">
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengajar</span>
                            <span className="font-bold text-slate-800 text-xs md:text-xs">{pengajarDisplayName(s.pengajar) || '-'}</span>
                          </div>
                        </div>

                        
                        <div className="md:hidden flex flex-col items-end pt-4 pb-1 border-t border-slate-100 gap-2 mt-auto">
                          <div className="h-[22px] flex items-center">
                            {isPengganti && (
                              <span className="text-[10px] font-bold bg-crimson/10 text-crimson border border-crimson/20 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                                Pengganti
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenModal('edit', s)}
                              disabled={isPengganti}
                              className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-crimson active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Edit sesi"
                              title={isPengganti ? 'Sesi pengganti tidak bisa diedit di sini' : 'Edit sesi'}
                            >
                              <Pencil className="w-4 h-4 mx-auto" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOpen(s)}
                              className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-crimson active:scale-95 transition-all"
                              aria-label="Hapus sesi"
                              title="Hapus sesi"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </div>
                        </div>

                        
                        <div className="hidden md:flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenModal('edit', s)}
                              disabled={isPengganti}
                              className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-crimson active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Edit sesi"
                              title={isPengganti ? 'Sesi pengganti tidak bisa diedit di sini' : 'Edit sesi'}
                            >
                              <Pencil className="w-4 h-4 mx-auto" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOpen(s)}
                              className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-crimson active:scale-95 transition-all"
                              aria-label="Hapus sesi"
                              title="Hapus sesi"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </div>
                          {isPengganti && (
                            <span className="text-[10px] font-bold bg-crimson/10 text-crimson border border-crimson/20 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                              Pengganti
                            </span>
                          )}
                        </div>
                      </article>
                    </section>
                  );
                };

                return (
                  <>
                    {keys.map(dateKey => (
                      <div key={dateKey} className="flex flex-col gap-3">
                        <div className="flex items-center px-1">
                          <h3 className="text-sm font-bold text-slate-800">{formatDisplayDate(dateKey)}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                          {grouped[dateKey].map(s => (
                            <ScheduleCard key={sessionRowKey(s)} s={s} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}

            {!loading && viewType === 'CARD' && !fetchError && filtered.length === 0 && (
              <div className="bg-white rounded-2xl p-8 md:p-12 border border-dashed border-slate-200 text-center shadow-sm">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <CalendarDays size={26} />
                </div>
                <p className="text-sm md:text-base font-semibold text-slate-700">Tidak ada sesi jadwal.</p>
                <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                  {hasActiveSearch
                    ? 'Coba ubah kata kunci atau filter tipe sesi.'
                    : 'Belum ada sesi pada rentang tanggal ini.'}
                </p>
              </div>
            )}
          </div>

          <p className="shrink-0 text-[10px] md:text-[11px] font-extrabold text-slate-400/70 tracking-widest uppercase px-1 pt-3 pb-0.5 border-t border-slate-100/80 mt-2 text-center">
            End
          </p>
        </div>
      </div>


      <button
        type="button"
        onClick={handleOpenSemesterSheet}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-white text-slate-600 border border-slate-200/80 rounded-full flex items-center justify-center shadow-md z-20 active:scale-90 transition-transform"
        aria-label="Pilih semester"
      >
        <CalendarDays className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => handleOpenModal('add')}
        disabled={!selectedSemesterId}
        className="md:hidden fixed bottom-7 right-4 w-14 h-14 bg-crimson text-white rounded-full flex items-center justify-center shadow-lg shadow-crimson/30 z-20 active:scale-90 transition-transform disabled:opacity-50"
        aria-label="Buat sesi baru"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>


      {isModalOpen && (
        <>
          <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isModalVisible && !isClosing ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseModal}
          />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none p-0 md:p-4">
            <div
              className={`w-full max-w-lg bg-white rounded-t-[28px] md:rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-6rem)] md:max-h-[80vh] overflow-hidden pointer-events-auto transition-all duration-300 ${isMd ? (isModalVisible && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95') : ''}`}
              style={
                !isMd
                  ? {
                    transform: !isModalVisible || isClosing ? 'translateY(100%)' : `translateY(${sheetDragY}px)`,
                    transition: !isModalVisible || isClosing || sheetDragY === 0 ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
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

              <div className="px-5 pt-2 md:pt-6 pb-2 overflow-y-auto hide-scrollbar flex-1">
                <h2 className="text-[20px] font-extrabold text-[#1F2937]">
                  {modalType === 'add' ? 'Buat Sesi Baru' : 'Edit Sesi'}
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  {selectedSemester
                    ? semesterLabel(selectedSemester.tahun_ajaran, selectedSemester.tipe_semester)
                    : 'Pilih semester'}
                </p>

                {dropdownLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <form
                    className="space-y-4 mt-5 pb-4"
                    onSubmit={e => {
                      e.preventDefault();
                      handleSubmit();
                    }}
                  >
                    <FieldCRUD
                      label="Kelas"
                      onCreate={() => openMasterCreate('kelas')}
                      onEdit={() => openMasterEdit('kelas', selectedKelasItem)}
                      canEdit={!!selectedKelasItem}
                    >
                      <CustomSelect
                        value={form.id_kelas}
                        onChange={v => setForm(f => ({ ...f, id_kelas: v }))}
                        options={kelasOptions}
                        placeholder="Pilih kelas"
                        searchable
                        searchPlaceholder="Cari kelas..."
                        onDeleteOption={(id) => {
                          const item = kelasList.find(k => k.id === id) ?? null;
                          openMasterDelete('kelas', item);
                        }}
                      />
                    </FieldCRUD>

                    <FieldCRUD
                      label="Mata Kuliah"
                      onCreate={() => openMasterCreate('mk')}
                      onEdit={() => openMasterEdit('mk', selectedMkItem)}
                      canEdit={!!selectedMkItem}
                    >
                      <CustomSelect
                        value={form.id_mk}
                        onChange={v => setForm(f => ({ ...f, id_mk: v }))}
                        options={mkOptions}
                        placeholder="Pilih mata kuliah"
                        searchable
                        searchPlaceholder="Cari mata kuliah..."
                        onDeleteOption={(id) => {
                          const item = mkList.find(m => m.id === id) ?? null;
                          openMasterDelete('mk', item);
                        }}
                      />
                    </FieldCRUD>

                    <FieldCRUD
                      label="Ruangan"
                      onCreate={() => openMasterCreate('ruangan')}
                      onEdit={() => openMasterEdit('ruangan', selectedRuanganItem)}
                      canEdit={!!selectedRuanganItem}
                    >
                      <CustomSelect
                        value={form.id_ruangan}
                        onChange={v => setForm(f => ({ ...f, id_ruangan: v }))}
                        options={ruanganOptions}
                        placeholder="Pilih ruangan"
                        searchable
                        searchPlaceholder="Cari ruangan..."
                        onDeleteOption={(id) => {
                          const item = ruanganList.find(r => r.id === id) ?? null;
                          openMasterDelete('ruangan', item);
                        }}
                      />
                      {conflictInfo.ruangan && (
                        <div className="flex items-start gap-1.5 mt-1.5 px-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-600 font-semibold leading-snug">
                            Ruangan sudah dipakai: {conflictInfo.ruangan.mata_kuliah} — {conflictInfo.ruangan.nama_kelas}
                          </p>
                        </div>
                      )}
                    </FieldCRUD>

                    <Field label="Tanggal Sesi">
                      <input
                        type="date"
                        value={form.tanggal}
                        onChange={e => handleFormTanggalChange(e.target.value)}
                        className={selectClass}
                        required
                      />
                      {form.tanggal && (
                        <p className="text-[11px] text-slate-500 font-medium mt-1 ml-1">
                          Hari: {HARI_OPTIONS.find(h => h.value === form.opsi_hari)?.label ?? '—'}
                        </p>
                      )}
                    </Field>

                    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-3">
                      <Field label="Hari (otomatis dari tanggal)">
                        <CustomSelect
                          value={String(form.opsi_hari)}
                          onChange={v => setForm(f => ({ ...f, opsi_hari: Number(v) }))}
                          options={HARI_SELECT_OPTIONS}
                          triggerClassName="bg-slate-50"
                        />
                      </Field>
                      <Field label="Jam">
                        <CustomSelect
                          value={String(form.opsi_jam)}
                          onChange={v => setForm(f => ({ ...f, opsi_jam: Number(v) }))}
                          options={JAM_SELECT_OPTIONS}
                        />
                        {(conflictInfo.ruangan || conflictInfo.pengajar) && (
                          <div className="flex items-start gap-1.5 mt-1.5 px-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-600 font-semibold leading-snug">
                              Ada konflik jadwal di slot jam ini
                            </p>
                          </div>
                        )}
                      </Field>
                    </div>
                    <Field label="Tipe Pengajar">
                      <CustomSelect
                        value={instructorType}
                        onChange={v => {
                          const type = v as 'DOSEN' | 'ASDOS';
                          setInstructorType(type);
                          if (type === 'DOSEN') {
                            setForm(f => ({ ...f, id_asdos1: '', id_asdos2: '' }));
                          } else {
                            setForm(f => ({ ...f, id_dosen: '' }));
                          }
                        }}
                        options={[
                          { value: 'DOSEN', label: 'Dosen' },
                          { value: 'ASDOS', label: 'Asisten Dosen' },
                        ]}
                        icon={instructorType === 'DOSEN' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      />
                    </Field>

                    {instructorType === 'DOSEN' ? (
                      <FieldCRUD
                        label="Dosen Pengajar"
                        onCreate={() => openMasterCreate('lecturer')}
                        onEdit={() => openMasterEdit('lecturer', selectedLecturerItem)}
                        canEdit={!!selectedLecturerItem}
                      >
                        <CustomSelect
                          value={form.id_dosen}
                          onChange={v => setForm(f => ({
                            ...f,
                            id_dosen: v,
                            id_asdos1: '',
                            id_asdos2: ''
                          }))}
                          options={[{ value: '', label: 'Pilih Dosen' }, ...lecturerOptions]}
                          placeholder="Pilih Dosen"
                          icon={<User className="w-4 h-4" />}
                          searchable
                          searchPlaceholder="Cari dosen..."
                          onDeleteOption={(id) => {
                            if (!id) return;
                            const item = lecturerList.find(l => l.id === id) ?? null;
                            openMasterDelete('lecturer', item);
                          }}
                        />
                        {conflictInfo.pengajar && (
                          <div className="flex items-start gap-1.5 mt-1.5 px-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-600 font-semibold leading-snug">
                              Dosen sudah mengajar: {conflictInfo.pengajar.mata_kuliah} — {conflictInfo.pengajar.nama_kelas}
                            </p>
                          </div>
                        )}
                      </FieldCRUD>
                    ) : (
                      <>
                        <Field label="Asisten Dosen 1">
                          <CustomSelect
                            value={form.id_asdos1}
                            onChange={v => setForm(f => ({
                              ...f,
                              id_asdos1: v,
                              id_dosen: ''
                            }))}
                            options={[{ value: '', label: 'Pilih Asisten Dosen 1' }, ...asdosOptions]}
                            placeholder="Pilih Asisten Dosen 1"
                            icon={<Users className="w-4 h-4" />}
                          />
                          {conflictInfo.pengajar && (
                            <div className="flex items-start gap-1.5 mt-1.5 px-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-amber-600 font-semibold leading-snug">
                                Asdos sudah mengajar: {conflictInfo.pengajar.mata_kuliah} — {conflictInfo.pengajar.nama_kelas}
                              </p>
                            </div>
                          )}
                        </Field>

                        <Field label="Asisten Dosen 2">
                          <CustomSelect
                            value={form.id_asdos2}
                            onChange={v => setForm(f => ({
                              ...f,
                              id_asdos2: v,
                              id_dosen: ''
                            }))}
                            options={[{ value: '', label: 'Opsional (Asisten Dosen 2)' }, ...asdos2Options]}
                            placeholder="Opsional"
                            icon={<Users className="w-4 h-4" />}
                          />
                          {conflictInfo.pengajar && (
                            <div className="flex items-start gap-1.5 mt-1.5 px-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-amber-600 font-semibold leading-snug">
                                Asdos sudah mengajar: {conflictInfo.pengajar.mata_kuliah} — {conflictInfo.pengajar.nama_kelas}
                              </p>
                            </div>
                          )}
                        </Field>
                      </>
                    )}
                  </form>
                )}
              </div>

              <div className="sticky bottom-0 p-5 border-t border-slate-100 bg-white flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-[15px] active:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || dropdownLoading}
                  className="flex-1 py-3.5 rounded-xl bg-crimson text-white font-bold text-[15px] shadow-md shadow-crimson/20 active:scale-[0.98] disabled:opacity-60"
                >
                  {isSubmitting ? 'Menyimpan...' : modalType === 'add' ? 'Buat Sesi' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}


      {deleteTarget && (
        <>
          <div
            className={`fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${isDeleteVisible && !isDeleteClosing ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseDelete}
          />
          <div className="fixed inset-0 z-[61] flex items-end md:items-center justify-center pointer-events-none">
            <div
              className={`w-full max-w-md bg-white rounded-t-[28px] md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto mx-0 md:mx-4 transition-all duration-300 ${isMd ? (isDeleteVisible && !isDeleteClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95') : ''}`}
              style={
                !isMd
                  ? {
                    transform: !isDeleteVisible || isDeleteClosing ? 'translateY(100%)' : `translateY(${deleteSheetDragY}px)`,
                    transition:
                      !isDeleteVisible || isDeleteClosing || deleteSheetDragY === 0
                        ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                        : 'none',
                  }
                  : {}
              }
            >
              <div
                className="w-full flex md:hidden items-center justify-center pt-4 pb-2 touch-none"
                onTouchStart={handleDeleteTouchStart}
                onTouchMove={handleDeleteTouchMove}
                onTouchEnd={handleDeleteTouchEnd}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>
              <div className="px-5 pt-2 md:pt-6 pb-6 md:pb-8">
                <h2 className="text-[20px] font-extrabold text-[#1F2937]">Hapus Sesi?</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Sesi <span className="font-semibold text-slate-700">{deleteTarget.mata_kuliah}</span> pada{' '}
                  {deleteTarget.tanggal} akan dihapus permanen.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseDelete}
                    disabled={isDeleteSubmitting}
                    className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleteSubmitting}
                    className="flex-1 py-3.5 rounded-xl bg-crimson text-white font-bold shadow-md shadow-crimson/20 disabled:opacity-60"
                  >
                    {isDeleteSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      {isDeleteSemesterOpen && (
        <>
          <div
            className={`fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${isDeleteSemesterVisible && !isDeleteSemesterClosing ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseDeleteSemester}
          />
          <div className="fixed inset-0 z-[61] flex items-end md:items-center justify-center pointer-events-none">
            <div
              className={`w-full max-w-md bg-white rounded-t-[28px] md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto mx-0 md:mx-4 transition-all duration-300 ${isMd ? (isDeleteSemesterVisible && !isDeleteSemesterClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95') : ''}`}
              style={
                !isMd
                  ? {
                    transform: !isDeleteSemesterVisible || isDeleteSemesterClosing ? 'translateY(100%)' : `translateY(${deleteSemesterSheetDragY}px)`,
                    transition:
                      !isDeleteSemesterVisible || isDeleteSemesterClosing || deleteSemesterSheetDragY === 0
                        ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                        : 'none',
                  }
                  : {}
              }
            >
              <div
                className="w-full flex md:hidden items-center justify-center pt-4 pb-2 touch-none"
                onTouchStart={handleDeleteSemesterTouchStart}
                onTouchMove={handleDeleteSemesterTouchMove}
                onTouchEnd={handleDeleteSemesterTouchEnd}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>
              <div className="px-5 pt-2 md:pt-6 pb-6 md:pb-8">
                <h2 className="text-[20px] font-extrabold text-[#1F2937]">Hapus Semester?</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Apakah anda yakin untuk menghapus semester <span className="font-semibold text-slate-700">{deleteSemesterTarget ? semesterLabel(deleteSemesterTarget.tahun_ajaran, deleteSemesterTarget.tipe_semester) : ''}</span>? Semua data sesi pada semester ini akan dihapus permanen.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseDeleteSemester}
                    disabled={isDeleteSemesterSubmitting}
                    className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteSemester}
                    disabled={isDeleteSemesterSubmitting}
                    className="flex-1 py-3.5 rounded-xl bg-crimson text-white font-bold shadow-md shadow-crimson/20 disabled:opacity-60"
                  >
                    {isDeleteSemesterSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isSemesterSheetOpen && (
        <>
          <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isSemesterSheetVisible && !isSemesterSheetClosing ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseSemesterSheet}
          />
          <div className="fixed inset-0 z-[61] flex items-end justify-center pointer-events-none">
            <div
              className="w-full max-w-lg bg-white rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
              style={{
                maxHeight: '80dvh',
                transform: !isSemesterSheetVisible || isSemesterSheetClosing ? 'translateY(100%)' : `translateY(${semesterSheetDragY}px)`,
                transition: !isSemesterSheetVisible || isSemesterSheetClosing || semesterSheetDragY === 0 ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
              }}
            >
              <div
                className="w-full flex items-center justify-center pt-4 pb-2 touch-none shrink-0"
                onTouchStart={handleSemesterSheetTouchStart}
                onTouchMove={handleSemesterSheetTouchMove}
                onTouchEnd={handleSemesterSheetTouchEnd}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              <div className="px-5 pt-1 pb-3 flex items-center justify-between shrink-0">
                <h2 className="text-[18px] font-extrabold text-[#1F2937]">Pilih Semester</h2>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseSemesterSheet();
                    setTimeout(() => openMasterCreate('semester'), 350);
                  }}
                  className="text-[11px] font-extrabold text-crimson hover:text-[#7a1727] active:scale-95 transition-all uppercase tracking-wider flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                  Buat
                </button>
              </div>

              <div className="px-4 pb-8 overflow-y-auto flex-1">
                {semesters.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Belum ada semester.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {semesters.map(s => {
                      const isSelected = s.id === selectedSemesterId;
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${isSelected ? 'bg-crimson/5 border-crimson/20' : 'bg-slate-50 border-transparent'}`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSemesterId(s.id);
                              handleCloseSemesterSheet();
                            }}
                            className="flex-1 text-left flex items-center gap-3 min-w-0"
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-crimson' : 'border-slate-300'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-crimson" />}
                            </div>
                            <span className={`font-bold text-sm truncate ${isSelected ? 'text-crimson' : 'text-slate-800'}`}>
                              {semesterLabel(s.tahun_ajaran, s.tipe_semester)}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleCloseSemesterSheet();
                              setTimeout(() => handleDeleteSemesterOpen(s.id), 350);
                            }}
                            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-95 transition-all"
                            aria-label="Hapus semester"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <MasterEntityModal
        open={masterModal.open}
        mode={masterModal.mode}
        resource={masterModal.resource}
        initialData={masterModal.initialData}
        onClose={closeMasterModal}
        onSuccess={handleMasterSuccess}
      />

      {isTableExpanded && timetableData && typeof document !== 'undefined' ? createPortal(
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200]" onClick={() => setIsTableExpanded(false)} />
          <div className="fixed inset-4 md:inset-8 z-[201] bg-white rounded-[12px] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTableDate(toIsoDateFromDate(addDays(parseLocalDate(tableDate), -1)))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-crimson hover:border-crimson/30 transition-all active:scale-95 text-sm font-bold"
                >‹</button>
                <span className="text-sm font-extrabold text-slate-800">
                  {parseLocalDate(tableDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => setTableDate(toIsoDateFromDate(addDays(parseLocalDate(tableDate), 1)))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-crimson hover:border-crimson/30 transition-all active:scale-95 text-sm font-bold"
                >›</button>
              </div>
              <button type="button" onClick={() => setIsTableExpanded(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-crimson hover:border-crimson/30 transition-all active:scale-95">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-auto flex-1">
              {timetableData.rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <CalendarDays size={32} />
                  <p className="text-sm font-semibold">Tidak ada sesi jadwal.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-slate-50/90 border-b border-slate-100">
                      <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[120px] border-r border-slate-100">Jam</th>
                      {timetableData.rooms.map(room => (
                        <th key={room} className="px-5 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">{room}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {timetableData.jams.map(jam => (
                      <tr key={jam.value} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-4 py-4 border-r border-slate-100">
                          <span className="text-xs font-bold text-slate-600 whitespace-nowrap font-mono">{jam.range}</span>
                        </td>
                        {timetableData.rooms.map(room => {
                          const s = timetableData.lookup[jam.value]?.[room];
                          if (!s) return <td key={room} className="px-4 py-4 text-center"><span className="text-slate-200 text-sm">—</span></td>;
                          const isPengganti = isPenggantiTipe(s.tipe);
                          return (
                            <td key={room} className="px-3 py-3">
                              <div className={`rounded-xl px-4 py-3 text-center ${isPengganti ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50 border border-slate-100'}`}>
                                <p className="text-sm font-bold leading-snug text-slate-700">{s.mata_kuliah}</p>
                                {s.nama_kelas && <p className="text-xs text-slate-400 font-medium mt-0.5">{s.nama_kelas}</p>}
                                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <p className="text-xs text-slate-400">{pengajarDisplayName(s.pengajar) || '-'}</p>
                                </div>
                                {isPengganti && <span className="mt-2 inline-block text-[9px] font-bold uppercase tracking-wider text-crimson bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">Pengganti</span>}
                                <div className="flex justify-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                                  <button type="button" onClick={() => { setIsTableExpanded(false); handleOpenModal('edit', s); }} disabled={isPengganti} className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-crimson hover:border-crimson/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed" title={isPengganti ? 'Sesi pengganti tidak bisa diedit' : 'Edit sesi'}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button type="button" onClick={() => { setIsTableExpanded(false); handleDeleteOpen(s); }} className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-crimson hover:border-rose-200 hover:bg-rose-50 active:scale-95 transition-all" title="Hapus sesi">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>,
        document.body
      ) : null}

    </AsdosPageShell>
  );
}
