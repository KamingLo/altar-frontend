'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  Pencil,
  Plus,
  Search,
  User,
  Users,
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
  getMonthBounds,
  isPenggantiTipe,
  isSubstituteSessionId,
  normalizeSessionTipe,
  pengajarDisplayName,
  semesterLabel,
  sessionDateKey,
  sessionRowKey,
  toIsoDate,
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

const dayNamesGrid = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
const FILTER_TIPE_OPTIONS = [
  { value: 'ALL', label: 'Semua Tipe' },
  { value: 'REGULER', label: 'Reguler' },
  { value: 'PENGGANTI', label: 'Pengganti' },
];
const HARI_SELECT_OPTIONS = HARI_OPTIONS.map(h => ({ value: String(h.value), label: h.label }));
const JAM_SELECT_OPTIONS = JAM_OPTIONS.map(j => ({
  value: String(j.value),
  label: j.label,
  description: j.range,
}));
const dayNamesFull = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

type TipeFilter = 'ALL' | 'REGULER' | 'PENGGANTI';

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

export default function ManajemenJadwalPage() {
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [sessions, setSessions] = useState<SessionTimeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(() => new Date().getDate().toString());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipe, setFilterTipe] = useState<TipeFilter>('ALL');

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
    mode: 'create' | 'edit';
    resource: MasterResource;
    initialData: MasterItem | null;
  }>({ open: false, mode: 'create', resource: 'kelas', initialData: null });

  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetStartY, setSheetStartY] = useState(0);
  const [deleteSheetDragY, setDeleteSheetDragY] = useState(0);
  const [deleteSheetStartY, setDeleteSheetStartY] = useState(0);

  const initialSemesterLoaded = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const gridOffset = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => ({
    date: (i + 1).toString(),
    dayMobile: dayNamesFull[(gridOffset + i) % 7],
  }));
  const selectedIso = toIsoDate(currentYear, currentMonth, parseInt(selectedDate, 10));
  const { start_date: rangeStart, end_date: rangeEnd } = getMonthBounds(currentYear, currentMonth);

  const selectedSemester = semesters.find(s => s.id === selectedSemesterId);

  const semesterOptions = useMemo(
    () => semesters.map(s => ({ value: s.id, label: semesterLabel(s.tahun_ajaran, s.tipe_semester) })),
    [semesters],
  );
  const kelasOptions = useMemo(
    () => kelasList.map(k => ({ value: k.id, label: k.nama_kelas, description: k.jurusan })),
    [kelasList],
  );
  const mkOptions = useMemo(
    () => mkList.map(m => ({ value: m.id, label: m.nama_mk, description: `${m.sks} SKS` })),
    [mkList],
  );
  const ruanganOptions = useMemo(
    () => ruanganList.map(r => ({ value: r.id, label: r.nama_ruangan, description: `Lantai ${r.lantai}` })),
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

  const refreshSessions = useCallback(async () => {
    if (!selectedSemesterId) return;
    setLoading(true);
    setFetchError(null);
    const res = await fetchSessions({
      id_semester: selectedSemesterId,
      start_date: rangeStart,
      end_date: rangeEnd,
    });
    if (res.success) {
      setSessions(res.items);
    } else {
      setSessions([]);
      setFetchError(res.message || 'Gagal memuat sesi jadwal.');
      if (!redirectIfSessionExpired(res.message)) {
        showToast(res.message);
      }
    }
    setLoading(false);
    setIsInitialLoad(false);
  }, [selectedSemesterId, rangeStart, rangeEnd, showToast]);

  useEffect(() => {
    (async () => {
      const res = await fetchSemesters();
      if (res.success && res.items.length) {
        setSemesters(res.items);
        if (!initialSemesterLoaded.current) {
          setSelectedSemesterId(res.items[0].id);
          initialSemesterLoaded.current = true;
        }
      } else {
        setIsInitialLoad(false);
        if (!res.success && !redirectIfSessionExpired(res.message)) {
          showToast(res.message);
        }
      }
    })();
  }, [showToast]);

  useEffect(() => {
    if (!selectedSemesterId) return;
    const t = setTimeout(() => refreshSessions(), 0);
    return () => clearTimeout(t);
  }, [selectedSemesterId, refreshSessions]);

  const loadDropdownData = useCallback(async (): Promise<DropdownData | null> => {
    setDropdownLoading(true);
    const res = await fetchDropdownData();
    setDropdownLoading(false);
    if (!res.success) {
      if (redirectIfSessionExpired(res.message)) return null;
      showToast(res.message);
      return null;
    }
    setKelasList(res.data.kelasList);
    setMkList(res.data.mkList);
    setRuanganList(res.data.ruanganList);
    setAsdosList(res.data.asdosList);
    setLecturerList(res.data.lecturerList);
    return res.data;
  }, [showToast]);

  const refreshSemesters = useCallback(async () => {
    const res = await fetchSemesters();
    if (res.success) {
      setSemesters(res.items);
      return res.items;
    }
    if (!redirectIfSessionExpired(res.message)) {
      showToast(res.message || 'Gagal memuat daftar semester.');
    }
    return null;
  }, [showToast]);

  const openMasterCreate = (resource: MasterResource) => {
    setMasterModal({ open: true, mode: 'create', resource, initialData: null });
  };

  const openMasterEdit = (resource: MasterResource, item: MasterItem | null) => {
    if (!item) {
      showToast('Pilih item terlebih dahulu untuk diedit.');
      return;
    }
    setMasterModal({ open: true, mode: 'edit', resource, initialData: item });
  };

  const closeMasterModal = () =>
    setMasterModal(m => ({ ...m, open: false }));

  const handleMasterSuccess = async (
    action: 'created' | 'updated' | 'deleted',
    item: MasterItem | null,
  ) => {
    const resource = masterModal.resource;
    const labelMap: Record<MasterResource, string> = {
      kelas: 'Kelas',
      mk: 'Mata Kuliah',
      ruangan: 'Ruangan',
      lecturer: 'Dosen',
      semester: 'Semester',
    };
    const actionLabel = action === 'created' ? 'dibuat' : action === 'updated' ? 'diperbarui' : 'dihapus';
    showToast(`${labelMap[resource]} berhasil ${actionLabel}.`, 'success');

    if (resource === 'semester') {
      await refreshSemesters();
      if (action === 'created' && item) setSelectedSemesterId((item as { id: string }).id);
      if (action === 'deleted' && item) {
        const deletedId = (item as { id: string }).id;
        if (selectedSemesterId === deletedId) setSelectedSemesterId('');
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

  const hasActiveSearch = Boolean(searchTerm.trim()) || filterTipe !== 'ALL';

  const hasSchedule = (date: string) => {
    const iso = toIsoDate(currentYear, currentMonth, parseInt(date, 10));
    return sessions.some(s => sessionDateKey(s.tanggal) === iso);
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const base = hasActiveSearch
      ? sessions
      : sessions.filter(s => sessionDateKey(s.tanggal) === selectedIso);

    return base.filter(s => {
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
  }, [sessions, searchTerm, filterTipe, selectedIso, hasActiveSearch]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(11);
    } else setCurrentMonth(m => m - 1);
    setSelectedDate('1');
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(0);
    } else setCurrentMonth(m => m + 1);
    setSelectedDate('1');
  };

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
      setForm(emptyForm(selectedIso));
      setInstructorType('DOSEN');
    } else if (session) {
      setForm(emptyForm(sessionDateKey(session.tanggal)));
    }

    const lists = await loadDropdownData();
    if (!lists) return;

    if (type === 'add') {
      setForm(emptyForm(selectedIso));
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
      if (!filled.id_kelas || !filled.id_mk || !filled.id_ruangan) {
        showToast(
          'Beberapa data tidak ditemukan di daftar. Pilih ulang kelas, mata kuliah, atau ruangan sebelum menyimpan.',
        );
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
    if (!selectedSemesterId) {
      showToast('Pilih semester terlebih dahulu.');
      return;
    }
    if (!form.tanggal) {
      showToast('Tanggal sesi wajib diisi.');
      return;
    }
    if (!form.id_kelas || !form.id_mk || !form.id_ruangan) {
      showToast('Kelas, mata kuliah, dan ruangan wajib diisi.');
      return;
    }
    if (modalType === 'edit' && !editingId) {
      showToast('Sesi tidak valid untuk diedit.');
      return;
    }

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
      const resError = (res as Record<string, unknown>).error;
      const detail = typeof resError === 'string' ? ` (${resError})` : '';
      showToast((res.message || 'Gagal menyimpan sesi.') + detail);
      return;
    }
    showToast(res.message || 'Sesi berhasil disimpan.', 'success');
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
      showToast(res.message || 'Gagal menghapus sesi.');
      return;
    }
    showToast(res.message || 'Sesi berhasil dihapus.', 'success');
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

  const selectedDayLabel = calendarDays[parseInt(selectedDate, 10) - 1]?.dayMobile ?? '';

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


        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start">

          <div className="w-full md:w-[300px] lg:w-[320px] shrink-0 flex flex-col">

            <div className="hidden md:flex items-center h-7 mb-2 w-full">
              <div className="h-3.5 w-32 rounded-md animate-shimmer"></div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div className="h-5 w-28 rounded-md animate-shimmer"></div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full animate-shimmer"></div>
                  <div className="w-8 h-8 rounded-full animate-shimmer"></div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-y-4 gap-x-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={`d-${i}`} className="h-3 w-6 rounded mx-auto animate-shimmer"></div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <div key={`c-${i}`} className="w-9 h-9 rounded-xl mx-auto flex items-center justify-center animate-shimmer"></div>
                ))}
              </div>
            </div>
          </div>


          <div className="flex-1 w-full space-y-4">
            <div className="hidden md:flex justify-end h-7 mb-2 items-center">
              <div className="h-6 w-16 rounded-md animate-shimmer"></div>
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`card-${i}`} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-start gap-4">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl shrink-0 animate-shimmer"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-5 w-2/3 rounded animate-shimmer"></div>
                  <div className="h-3.5 w-1/3 rounded animate-shimmer"></div>
                  <div className="flex gap-2 pt-2.5">
                    <div className="h-6 w-20 border border-slate-100 rounded-lg animate-shimmer"></div>
                    <div className="h-6 w-20 border border-slate-100 rounded-lg animate-shimmer"></div>
                    <div className="h-6 w-24 border border-slate-100 rounded-lg animate-shimmer"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AsdosPageShell className="pb-24 md:pb-12">

      <div className="shrink-0">
        <div className="mb-4 md:mb-8 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <AsdosPageHeader eyebrow="Koordinator" title="Manajemen Jadwal" description="Kelola sesi jadwal mengajar per semester — data langsung dari server." />
          </div>

          <AsdosPrimaryButton
            type="button"
            onClick={() => handleOpenModal('add')}
            disabled={!selectedSemesterId}
            icon={<Plus className="w-5 h-5" strokeWidth={2.5} />}
            className="hidden md:flex py-3.5 px-6 text-[15px] mt-4 md:mt-0"
          >
            Buat Sesi Baru
          </AsdosPrimaryButton>
        </div>


        <div className="mb-5 md:mb-6 flex flex-col md:flex-row gap-3 relative z-20 w-full justify-between items-stretch md:items-center">

          <div className="relative shrink-0 w-full sm:w-auto md:w-auto z-30 flex items-center gap-2">
            <div className="flex-1 sm:w-48 md:w-56">
              <CustomSelect
                value={selectedSemesterId}
                onChange={setSelectedSemesterId}
                options={semesterOptions}
                placeholder="Semester"
                disabled={!semesters.length}
                icon={<CalendarDays className="w-[18px] h-[18px]" />}
                triggerClassName="rounded-2xl py-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              />
            </div>
            <button
              type="button"
              onClick={() => openMasterCreate('semester')}
              className="shrink-0 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-crimson active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              aria-label="Buat semester baru"
              title="Buat semester baru"
            >
              <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => openMasterEdit('semester', selectedSemester ?? null)}
              disabled={!selectedSemester}
              className="shrink-0 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-crimson active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500"
              aria-label="Edit semester terpilih"
              title="Edit semester terpilih"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3 flex-1 md:max-w-[420px] md:ml-auto w-full">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari MK, kelas, ruangan, pengajar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 outline-none text-sm font-medium text-slate-800 bg-white/95 placeholder-slate-400 focus:border-crimson focus:ring-2 focus:ring-crimson/15 transition-all"
              />
            </div>

            <div className="relative shrink-0">
              <CustomSelect
                variant="icon"
                align="right"
                value={filterTipe}
                onChange={v => setFilterTipe(v as TipeFilter)}
                options={FILTER_TIPE_OPTIONS}
                placeholder="Filter tipe"
                icon={<Filter className="w-[18px] h-[18px]" />}
                triggerClassName={
                  filterTipe !== 'ALL' ? 'bg-red-50 border-crimson text-crimson' : ''
                }
              />
            </div>
          </div>
        </div>


        <div className="md:hidden flex justify-between items-center mb-3 mt-1 px-1">
          <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
            {hasActiveSearch
              ? `Hasil pencarian`
              : `${selectedDayLabel}, ${selectedDate} ${monthLabel}`}
          </h3>
          <span className="bg-crimson/10 text-crimson text-[10px] font-bold px-2.5 py-1 rounded-md">
            {filtered.length} sesi
          </span>
        </div>


        <div className="md:hidden mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800">{monthLabel}</h3>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 active:scale-95 shadow-sm">
                <ChevronLeft className="w-[18px] h-[18px]" />
              </button>
              <button type="button" onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 active:scale-95 shadow-sm">
                <ChevronRight className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden snap-x">
            {calendarDays.map(item => {
              const sel = selectedDate === item.date;
              return (
                <button
                  key={item.date}
                  type="button"
                  onClick={() => setSelectedDate(item.date)}
                  className={`flex flex-col items-center min-w-[64px] py-3.5 rounded-2xl transition-all snap-center shrink-0 border
                  ${sel ? 'bg-crimson text-white shadow-lg shadow-crimson/20 border-crimson' : 'bg-white text-slate-500 border-slate-100'}`}
                >
                  <span className={`text-[10px] font-bold tracking-widest mb-1 ${sel ? 'text-white/80' : 'text-slate-400'}`}>
                    {item.dayMobile}
                  </span>
                  <span className="text-xl font-bold mb-1">{item.date}</span>
                  <div className={`w-1 h-1 rounded-full ${sel ? 'bg-white' : hasSchedule(item.date) ? 'bg-crimson/50' : 'bg-transparent'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start">

        <div className="hidden md:flex flex-col w-[300px] lg:w-[320px] shrink-0 md:sticky md:top-24">
          <div className="hidden md:flex items-center h-7 mb-2 w-full shrink-0">
            <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
              {hasActiveSearch
                ? `Hasil pencarian`
                : `${selectedDayLabel}, ${selectedDate} ${monthLabel}`}
            </h3>
          </div>
          <div className="w-full bg-white rounded-[2rem] p-6 md:p-7 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">{monthLabel}</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button type="button" onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-4 gap-x-1">
              {dayNamesGrid.map((day, i) => (
                <div key={i} className="text-center text-[11px] font-bold text-[#8BA3CB] mb-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: gridOffset }).map((_, i) => (
                <div key={`sp-${i}`} />
              ))}
              {calendarDays.map(item => {
                const sel = selectedDate === item.date;
                const hasItem = hasSchedule(item.date);
                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => setSelectedDate(item.date)}
                    className="flex flex-col items-center justify-center group"
                  >
                    <div
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200
                      ${sel ? 'bg-crimson text-white shadow-md' : 'bg-transparent text-slate-700 group-hover:bg-slate-100'}`}
                    >
                      <span className="text-sm font-bold">{item.date}</span>
                    </div>
                    <div
                      className={`w-1 h-1 rounded-full mt-1.5 transition-all
                      ${sel && hasItem ? 'bg-crimson' : !sel && hasItem ? 'bg-crimson/50' : 'bg-transparent'}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>


        <div className="flex flex-col flex-1 min-w-0 w-full md:min-h-[320px]">

          <div className="hidden md:flex justify-end items-center h-7 mb-2 shrink-0">
            <span className="bg-crimson/10 text-crimson text-[10px] font-bold px-2.5 py-1 rounded-md">
              {filtered.length} sesi
            </span>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading &&
              filtered.map(s => {
                const timePart = s.waktu.includes(', ') ? s.waktu.split(', ')[1] : s.waktu;
                return (
                  <div
                    key={sessionRowKey(s)}
                    className="bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm border border-slate-100 md:hover:shadow-md md:hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center bg-rose-50 text-crimson">
                        <BookOpen size={20} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-[15px] md:text-base text-[#1F2937] truncate">{s.mata_kuliah}</h3>
                          {isPenggantiTipe(s.tipe) && (
                            <span className="shrink-0 text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-md tracking-wider">
                              PENGGANTI
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {s.nama_kelas}
                          {hasActiveSearch && (
                            <span className="text-slate-400"> Â· {sessionDateKey(s.tanggal)}</span>
                          )}
                        </p>
                        <div className="hidden md:flex flex-wrap gap-2 mt-2.5">
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            {timePart}
                          </div>
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            {s.ruangan}
                          </div>
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
                            <User size={12} className="text-slate-400 shrink-0" />
                            {pengajarDisplayName(s.pengajar)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col gap-1 shrink-0">
                        {!isPenggantiTipe(s.tipe) && (
                          <button
                            type="button"
                            onClick={() => handleOpenModal('edit', s)}
                            className="p-2 rounded-lg text-slate-400 hover:text-crimson hover:bg-rose-50 transition-colors"
                            aria-label="Edit sesi"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteOpen(s)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          aria-label="Hapus sesi"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-100 md:hidden">
                      <div className="flex w-full items-center gap-2.5 bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <span className="min-w-0 truncate">{timePart}</span>
                      </div>
                      <div className="flex w-full items-center gap-2.5 bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="min-w-0 truncate">{s.ruangan}</span>
                      </div>
                      <div className="flex w-full items-center gap-2.5 bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700">
                        <User size={14} className="text-slate-400 shrink-0" />
                        <span className="min-w-0 truncate">{pengajarDisplayName(s.pengajar)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

            {!loading && !fetchError && filtered.length === 0 && (
              <div className="bg-white rounded-2xl p-8 md:p-12 border border-dashed border-slate-200 text-center shadow-sm">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <CalendarDays size={26} />
                </div>
                <p className="text-sm md:text-base font-semibold text-slate-700">Tidak ada sesi jadwal.</p>
                <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                  {hasActiveSearch
                    ? 'Coba ubah kata kunci atau filter tipe sesi.'
                    : 'Belum ada sesi pada tanggal ini.'}
                </p>
              </div>
            )}
          </div>

          <p className="shrink-0 text-[11px] font-medium text-slate-400 px-1 pt-2 pb-0.5 border-t border-slate-100/80 mt-1">
            {hasActiveSearch
              ? `Menampilkan ${filtered.length} sesi (pencarian aktif)`
              : `Menampilkan ${filtered.length} sesi pada ${selectedIso}`}
          </p>
        </div>
      </div>


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
              className={`w-full max-w-lg bg-white rounded-t-[28px] md:rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-6rem)] md:max-h-[80vh] overflow-hidden pointer-events-auto transition-all duration-300 ${isMd ? (isModalVisible && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95') : ''
                }`}
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
                      />
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
                          Hari: {HARI_OPTIONS.find(h => h.value === form.opsi_hari)?.label ?? 'â€”'}
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
                          { value: 'ASDOS', label: 'Asisten Dosen (Asdos)' },
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
                        />
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
                            options={[{ value: '', label: 'Pilih Asdos 1' }, ...asdosOptions]}
                            placeholder="Pilih Asdos 1"
                            icon={<Users className="w-4 h-4" />}
                          />
                        </Field>

                        <Field label="Asisten Dosen 2">
                          <CustomSelect
                            value={form.id_asdos2}
                            onChange={v => setForm(f => ({
                              ...f,
                              id_asdos2: v,
                              id_dosen: ''
                            }))}
                            options={[{ value: '', label: 'Opsional (Asdos 2)' }, ...asdos2Options]}
                            placeholder="Opsional"
                            icon={<Users className="w-4 h-4" />}
                          />
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
              className={`w-full max-w-md bg-white rounded-t-[28px] md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto mx-0 md:mx-4 transition-all duration-300 ${isMd ? (isDeleteVisible && !isDeleteClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95') : ''
                }`}
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


      <MasterEntityModal
        open={masterModal.open}
        mode={masterModal.mode}
        resource={masterModal.resource}
        initialData={masterModal.initialData}
        onClose={closeMasterModal}
        onSuccess={handleMasterSuccess}
      />

      <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
        <div
          className={`
            max-w-md w-full flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border transition-all duration-500
            ${toast ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-12 opacity-0 scale-95'}
            ${toast?.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}
          `}
        >
          {toast?.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <p className="text-sm font-bold leading-tight">{toast?.message}</p>
        </div>
      </div>
    </AsdosPageShell>
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