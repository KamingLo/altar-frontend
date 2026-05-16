'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
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
  normalizeSessionTipe,
  pengajarDisplayName,
  semesterLabel,
  sessionDateKey,
  sessionRowKey,
  toIsoDate,
} from '@/lib/jadwal-utils';

const dayNamesGrid = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
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
});

export default function ManajemenJadwalPage() {
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [sessions, setSessions] = useState<SessionTimeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [semesterError, setSemesterError] = useState<string | null>(null);

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(() => new Date().getDate().toString());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipe, setFilterTipe] = useState<TipeFilter>('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<SessionTimeline | null>(null);
  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [mkList, setMkList] = useState<MataKuliahItem[]>([]);
  const [ruanganList, setRuanganList] = useState<RuanganItem[]>([]);
  const [asdosList, setAsdosList] = useState<AsdosListItem[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<SessionTimeline | null>(null);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isDeleteClosing, setIsDeleteClosing] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetStartY, setSheetStartY] = useState(0);
  const [deleteSheetDragY, setDeleteSheetDragY] = useState(0);
  const [deleteSheetStartY, setDeleteSheetStartY] = useState(0);

  const initialSemesterLoaded = useRef(false);

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
      setFetchError(res.message);
    }
    setLoading(false);
  }, [selectedSemesterId, rangeStart, rangeEnd]);

  useEffect(() => {
    (async () => {
      setSemesterError(null);
      const res = await fetchSemesters();
      if (res.success && res.items.length) {
        setSemesters(res.items);
        if (!initialSemesterLoaded.current) {
          setSelectedSemesterId(res.items[0].id);
          initialSemesterLoaded.current = true;
        }
      } else if (!res.success) {
        setSemesterError(res.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSemesterId) return;
    refreshSessions();
  }, [selectedSemesterId, refreshSessions]);

  const loadDropdownData = useCallback(async (): Promise<DropdownData | null> => {
    setDropdownLoading(true);
    const res = await fetchDropdownData();
    setDropdownLoading(false);
    if (!res.success) {
      setFormError(res.message);
      return null;
    }
    setKelasList(res.data.kelasList);
    setMkList(res.data.mkList);
    setRuanganList(res.data.ruanganList);
    setAsdosList(res.data.asdosList);
    return res.data;
  }, []);

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

  const monthStats = useMemo(() => {
    let reguler = 0;
    let pengganti = 0;
    for (const s of sessions) {
      if (normalizeSessionTipe(s.tipe) === 'PENGGANTI') pengganti++;
      else reguler++;
    }
    return { total: sessions.length, reguler, pengganti };
  }, [sessions]);

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

  const matchAsdos = (pengajar: string, asdos: AsdosListItem[]) => {
    const name = pengajarDisplayName(pengajar).toLowerCase();
    return (
      asdos.find(a => a.username.toLowerCase() === name) ??
      asdos.find(a => pengajar.toLowerCase().includes(a.username.toLowerCase())) ??
      asdos.find(a => name.includes(a.username.toLowerCase()))
    );
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
    id_dosen: null,
  });

  const prefillFromSession = (session: SessionTimeline, lists: {
    kelas: KelasItem[];
    mk: MataKuliahItem[];
    ruangan: RuanganItem[];
    asdos: AsdosListItem[];
  }): SessionForm => {
    const tanggal = sessionDateKey(session.tanggal);
    const kelas = findByDisplayLabel(lists.kelas, session.nama_kelas, k => k.nama_kelas);
    const mk = findByDisplayLabel(lists.mk, session.mata_kuliah, m => m.nama_mk);
    const ruangan = findByDisplayLabel(lists.ruangan, session.ruangan, r => r.nama_ruangan);
    const asdos1 = matchAsdos(session.pengajar, lists.asdos);
    return {
      tanggal,
      id_kelas: kelas?.id ?? '',
      id_mk: mk?.id ?? '',
      id_ruangan: ruangan?.id ?? '',
      opsi_hari: opsiHariFromTanggal(tanggal),
      opsi_jam: opsiJamFromWaktu(session.waktu),
      id_asdos1: asdos1?.id_asdos ?? '',
      id_asdos2: '',
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
    setFormError('');
    setIsClosing(false);
    setSheetDragY(0);
    setIsModalOpen(true);
    setTimeout(() => setIsModalVisible(true), 10);

    if (type === 'add') {
      setForm(emptyForm(selectedIso));
    } else if (session) {
      setForm(emptyForm(sessionDateKey(session.tanggal)));
    }

    const lists = await loadDropdownData();
    if (!lists) return;

    if (type === 'add') {
      setForm(emptyForm(selectedIso));
    } else if (session) {
      const filled = prefillFromSession(session, {
        kelas: lists.kelasList,
        mk: lists.mkList,
        ruangan: lists.ruanganList,
        asdos: lists.asdosList,
      });
      setForm(filled);
      if (!filled.id_kelas || !filled.id_mk || !filled.id_ruangan) {
        setFormError(
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
      setFormError('Pilih semester terlebih dahulu.');
      return;
    }
    if (!form.tanggal) {
      setFormError('Tanggal sesi wajib diisi.');
      return;
    }
    if (!form.id_kelas || !form.id_mk || !form.id_ruangan) {
      setFormError('Kelas, mata kuliah, dan ruangan wajib diisi.');
      return;
    }
    if (modalType === 'edit' && !editingId) {
      setFormError('Sesi tidak valid untuk diedit.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
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
      setFormError(res.message || 'Gagal menyimpan sesi.');
      return;
    }
    handleCloseModal();
    await refreshSessions();
  };

  const handleDeleteOpen = (session: SessionTimeline) => {
    setDeleteTarget(session);
    setDeleteError('');
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
    if (!deleteTarget) return;
    setIsDeleteSubmitting(true);
    setDeleteError('');
    const res = await hapusSesi(deleteTarget.id_sesi, sessionDateKey(deleteTarget.tanggal));
    setIsDeleteSubmitting(false);
    if (!res.success) {
      setDeleteError(res.message || 'Gagal menghapus sesi.');
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

  const selectedDayLabel = calendarDays[parseInt(selectedDate, 10) - 1]?.dayMobile ?? '';

  const selectClass =
    'w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] outline-none disabled:opacity-60';

  return (
    <div className="relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-0 md:pt-0 pb-28 md:pb-10 font-sans">
      {/* Header + kontrol atas */}
      <div className="shrink-0">
      <div className="mb-4 md:mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">
            Koordinator
          </p>
          <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Manajemen Jadwal</h2>
          <p className="text-sm text-slate-500 mt-1 md:text-base max-w-lg">
            Kelola sesi jadwal mengajar per semester — data langsung dari server.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:min-w-[320px]">
          <div className="relative flex-1">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#941C2F] pointer-events-none" />
            <select
              value={selectedSemesterId}
              onChange={e => setSelectedSemesterId(e.target.value)}
              disabled={!semesters.length}
              className={`${selectClass} pl-11 appearance-none cursor-pointer`}
            >
              {!semesters.length && <option value="">Belum ada semester</option>}
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {semesterLabel(s.tahun_ajaran, s.tipe_semester)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => handleOpenModal('add')}
            disabled={!selectedSemesterId}
            className="hidden md:flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] hover:bg-[#7a1728] active:scale-[0.98] transition-all shadow-md shadow-[#941C2F]/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Buat Sesi Baru
          </button>
        </div>
      </div>

      {/* Stats */}
      {selectedSemesterId && (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
          {[
            { label: 'Total Bulan Ini', value: monthStats.total, accent: 'text-[#941C2F]', bg: 'bg-rose-50' },
            { label: 'Reguler', value: monthStats.reguler, accent: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pengganti', value: monthStats.pengganti, accent: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(stat => (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-2xl border border-white/80 px-3 py-3.5 md:px-5 md:py-4 shadow-sm`}
            >
              <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl md:text-3xl font-extrabold mt-0.5 tabular-nums ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {semesterError && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-700 font-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>{semesterError}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="shrink-0 text-xs font-bold text-[#941C2F] underline"
          >
            Muat ulang
          </button>
        </div>
      )}

      {!semesters.length && !semesterError && (
        <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3.5 text-sm text-amber-800 font-medium">
          Belum ada semester tersedia. Pastikan backend sudah memiliki data semester aktif.
        </div>
      )}

      {/* Search & filter */}
      <div className="mb-5 flex gap-3 relative z-20">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari MK, kelas, ruangan, pengajar..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 text-sm md:text-base rounded-2xl md:rounded-3xl pl-11 md:pl-14 pr-4 py-3.5 md:py-4 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
          />
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`border p-3.5 md:p-4 rounded-2xl md:rounded-3xl active:scale-95 transition-all flex items-center justify-center
              ${filterTipe !== 'ALL' ? 'bg-red-50 border-[#941C2F] text-[#941C2F]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <Filter className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute right-0 top-[110%] w-52 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-2 overflow-hidden">
                {(['ALL', 'REGULER', 'PENGGANTI'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setFilterTipe(t);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${filterTipe === t ? 'bg-slate-50 text-[#941C2F] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {t === 'ALL' ? 'Semua Tipe' : t === 'REGULER' ? 'Reguler' : 'Pengganti'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-[11px] font-medium text-slate-400 mb-3 -mt-2 px-0.5">
        Rentang data: {rangeStart} – {rangeEnd}
        {selectedSemester && (
          <span className="text-slate-500">
            {' '}
            · {semesterLabel(selectedSemester.tahun_ajaran, selectedSemester.tipe_semester)}
          </span>
        )}
      </p>

      {/* Calendar mobile */}
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
                  ${sel ? 'bg-[#941C2F] text-white shadow-lg shadow-[#941C2F]/20 border-[#941C2F]' : 'bg-white text-slate-500 border-slate-100'}`}
              >
                <span className={`text-[10px] font-bold tracking-widest mb-1 ${sel ? 'text-white/80' : 'text-slate-400'}`}>
                  {item.dayMobile}
                </span>
                <span className="text-xl font-bold mb-1">{item.date}</span>
                <div className={`w-1 h-1 rounded-full ${sel ? 'bg-white' : hasSchedule(item.date) ? 'bg-[#941C2F]/50' : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-4 px-1">
          <h4 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
            {hasActiveSearch ? 'Hasil Pencarian' : 'Sesi Terdaftar'}
          </h4>
          <span className="bg-[#941C2F]/10 text-[#941C2F] text-[10px] font-bold px-2.5 py-1 rounded-md">{filtered.length} Sesi</span>
        </div>
      </div>

      </div>

      <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start">
        {/* Calendar desktop — tinggi natural, tidak ikut dipotong panel scroll */}
        <div className="hidden md:block w-[300px] lg:w-[320px] bg-white rounded-[2rem] p-6 md:p-7 shadow-sm border border-slate-100 shrink-0 md:sticky md:top-24">
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
                    ${sel ? 'bg-[#941C2F] text-white shadow-md' : 'bg-transparent text-slate-700 group-hover:bg-slate-100'}`}
                  >
                    <span className="text-sm font-bold">{item.date}</span>
                  </div>
                  <div
                    className={`w-1 h-1 rounded-full mt-1.5 transition-all
                    ${sel && hasItem ? 'bg-[#941C2F]' : !sel && hasItem ? 'bg-[#941C2F]/50' : 'bg-transparent'}`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Session list — hanya daftar kartu yang scroll */}
        <div className="flex flex-col flex-1 min-w-0 w-full md:min-h-[320px]">
          <div className="hidden md:flex justify-between items-center mb-2 shrink-0">
            <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
              {hasActiveSearch
                ? `Hasil pencarian · ${monthLabel}`
                : `${selectedDayLabel}, ${selectedDate} ${monthLabel}`}
            </h3>
            <span className="bg-[#941C2F]/10 text-[#941C2F] text-[10px] font-bold px-2.5 py-1 rounded-md">
              {filtered.length} sesi
            </span>
          </div>

          <div className="max-h-[min(52vh,480px)] md:max-h-[calc(100dvh-15rem)] overflow-y-auto overscroll-y-contain pr-1 space-y-3 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-2 border-[#941C2F] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {fetchError && !loading && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600 font-semibold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>{fetchError}</span>
              <button
                type="button"
                onClick={() => refreshSessions()}
                className="shrink-0 text-xs font-bold text-[#941C2F] underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!loading &&
            !fetchError &&
            filtered.map(s => {
              const timePart = s.waktu.includes(', ') ? s.waktu.split(', ')[1] : s.waktu;
              return (
                <div
                  key={sessionRowKey(s)}
                  className="bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm border border-slate-100 md:hover:shadow-md md:hover:border-slate-200 transition-all group"
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center bg-rose-50 text-[#941C2F]">
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
                          <span className="text-slate-400"> · {sessionDateKey(s.tanggal)}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
                          <Clock size={12} className="text-slate-400" />
                          {timePart}
                        </div>
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
                          <MapPin size={12} className="text-slate-400" />
                          {s.ruangan}
                        </div>
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
                          <User size={12} className="text-slate-400" />
                          {s.pengajar}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenModal('edit', s)}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#941C2F] hover:bg-rose-50 transition-colors"
                        aria-label="Edit sesi"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
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
              ? `Menampilkan ${filtered.length} sesi di ${monthLabel} (pencarian aktif)`
              : `Menampilkan ${filtered.length} sesi pada ${selectedIso}`}
          </p>
        </div>
      </div>

      {/* FAB mobile */}
      <button
        type="button"
        onClick={() => handleOpenModal('add')}
        disabled={!selectedSemesterId}
        className="md:hidden fixed bottom-7 right-4 w-14 h-14 bg-[#941C2F] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#941C2F]/30 z-20 active:scale-90 transition-transform disabled:opacity-50"
        aria-label="Buat sesi baru"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Form modal */}
      {isModalOpen && (
        <>
          <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isModalVisible && !isClosing ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseModal}
          />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none p-0 md:p-4">
            <div
              className="w-full max-w-lg bg-white rounded-t-[28px] md:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden pointer-events-auto"
              style={{
                transform: !isModalVisible || isClosing ? 'translateY(100%)' : `translateY(${sheetDragY}px)`,
                transition: !isModalVisible || isClosing || sheetDragY === 0 ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
              }}
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
                    <div className="w-6 h-6 border-2 border-[#941C2F] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <form
                    className="space-y-4 mt-5 pb-4"
                    onSubmit={e => {
                      e.preventDefault();
                      handleSubmit();
                    }}
                  >
                    <Field label="Kelas">
                      <select
                        value={form.id_kelas}
                        onChange={e => setForm(f => ({ ...f, id_kelas: e.target.value }))}
                        className={selectClass}
                        required
                      >
                        <option value="">Pilih kelas</option>
                        {kelasList.map(k => (
                          <option key={k.id} value={k.id}>
                            {k.nama_kelas} · {k.jurusan}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Mata Kuliah">
                      <select
                        value={form.id_mk}
                        onChange={e => setForm(f => ({ ...f, id_mk: e.target.value }))}
                        className={selectClass}
                        required
                      >
                        <option value="">Pilih mata kuliah</option>
                        {mkList.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.nama_mk} ({m.sks} SKS)
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Ruangan">
                      <select
                        value={form.id_ruangan}
                        onChange={e => setForm(f => ({ ...f, id_ruangan: e.target.value }))}
                        className={selectClass}
                        required
                      >
                        <option value="">Pilih ruangan</option>
                        {ruanganList.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nama_ruangan} · Lt.{r.lantai}
                          </option>
                        ))}
                      </select>
                    </Field>

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

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Hari (otomatis dari tanggal)">
                        <select
                          value={form.opsi_hari}
                          onChange={e => setForm(f => ({ ...f, opsi_hari: Number(e.target.value) }))}
                          className={`${selectClass} bg-slate-50`}
                        >
                          {HARI_OPTIONS.map(h => (
                            <option key={h.value} value={h.value}>
                              {h.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Jam">
                        <select
                          value={form.opsi_jam}
                          onChange={e => setForm(f => ({ ...f, opsi_jam: Number(e.target.value) }))}
                          className={selectClass}
                        >
                          {JAM_OPTIONS.map(j => (
                            <option key={j.value} value={j.value}>
                              {j.label} ({j.range})
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field label="Asisten Dosen 1">
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                          value={form.id_asdos1}
                          onChange={e => setForm(f => ({ ...f, id_asdos1: e.target.value }))}
                          className={`${selectClass} pl-11`}
                        >
                          <option value="">Opsional</option>
                          {asdosList.map(a => (
                            <option key={a.id_asdos} value={a.id_asdos}>
                              {a.username} · {a.nim}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Field>

                    <Field label="Asisten Dosen 2">
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                          value={form.id_asdos2}
                          onChange={e => setForm(f => ({ ...f, id_asdos2: e.target.value }))}
                          className={`${selectClass} pl-11`}
                        >
                          <option value="">Opsional</option>
                          {asdosList
                            .filter(a => a.id_asdos !== form.id_asdos1)
                            .map(a => (
                              <option key={a.id_asdos} value={a.id_asdos}>
                                {a.username} · {a.nim}
                              </option>
                            ))}
                        </select>
                      </div>
                    </Field>

                    {formError && (
                      <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
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
                  className="flex-1 py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] shadow-md shadow-[#941C2F]/20 active:scale-[0.98] disabled:opacity-60"
                >
                  {isSubmitting ? 'Menyimpan...' : modalType === 'add' ? 'Buat Sesi' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <>
          <div
            className={`fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${isDeleteVisible && !isDeleteClosing ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseDelete}
          />
          <div className="fixed inset-0 z-[61] flex items-end md:items-center justify-center pointer-events-none">
            <div
              className="w-full max-w-md bg-white rounded-t-[28px] md:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto mx-0 md:mx-4"
              style={{
                transform: !isDeleteVisible || isDeleteClosing ? 'translateY(100%)' : `translateY(${deleteSheetDragY}px)`,
                transition:
                  !isDeleteVisible || isDeleteClosing || deleteSheetDragY === 0
                    ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                    : 'none',
              }}
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
                {deleteError && (
                  <p className="mt-3 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">{deleteError}</p>
                )}
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
                    className="flex-1 py-3.5 rounded-xl bg-[#941C2F] text-white font-bold shadow-md shadow-[#941C2F]/20 disabled:opacity-60"
                  >
                    {isDeleteSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
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
