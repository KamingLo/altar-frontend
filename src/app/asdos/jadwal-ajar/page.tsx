'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, Filter, Maximize2, Search, Table2, User, Users, X } from 'lucide-react';
import { getMyScheduleTimeline, getScheduleTimeline, type SessionFromAPI } from '@/lib/actions/jadwal';
import { getRuanganList, getSemesterList } from '@/lib/actions/data-master';
import type { UnifiedJadwalResponse } from '@/types/api';
import { AsdosPageHeader, AsdosPageShell, AsdosState } from '@/components/dashboard/asdos/AsdosUI';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { pengajarDisplayName, sessionDateKey, subjectDisplayName, toIsoDateFromDate } from '@/lib/jadwal-utils';
import { JAM_OPTIONS, opsiJamFromWaktu } from '@/lib/constants/jadwal-slots';
import { useJadwalStore } from '@/store/useJadwalStore';
import { useUserStore } from '@/store/useUserStore';

type ViewMode = 'PERSONAL' | 'ALL';
type ScheduleStatus = 'Mendatang' | 'Berjalan' | 'Selesai';
type FilterStatus = 'ALL' | ScheduleStatus;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(start: string, end: string) {
  const diff = parseLocalDate(end).getTime() - parseLocalDate(start).getTime();
  return Math.floor(diff / 86400000);
}

function getSessionIso(waktu: string) {
  return sessionDateKey(waktu.split(',')[0] ?? '');
}

function formatDisplayDate(iso: string) {
  if (!iso) return '-';
  return parseLocalDate(iso).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

function deriveStatus(waktu: string): ScheduleStatus {
  const datePart = getSessionIso(waktu);
  const timePart = waktu.split(', ')[1] ?? '';
  const endTime = timePart.split(' - ')[1]?.trim();
  if (!datePart) return 'Mendatang';

  const sessionDate = parseLocalDate(datePart);
  const today = new Date();
  const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (sessionDay > todayDay) return 'Mendatang';
  if (sessionDay < todayDay) return 'Selesai';
  if (!endTime || endTime === '--:--') return 'Berjalan';

  const [h, m] = endTime.split(':').map(Number);
  const end = sessionDate;
  end.setHours(h || 0, m || 0, 0, 0);
  return new Date() >= end ? 'Selesai' : 'Berjalan';
}

function mapTimelineItems(items: UnifiedJadwalResponse[]): SessionFromAPI[] {
  return items.map(item => {
    const tipeJadwal = (item.tipe === 'REGULAR' || item.tipe === 'REGULER') ? 'REGULAR' : 'PENGGANTI';
    return {
      id_sesi: item.id_sesi,
      nama_kelas: item.nama_kelas,
      mata_kuliah: subjectDisplayName(item.mata_kuliah, tipeJadwal === 'PENGGANTI'),
      ruangan: item.ruangan,
      pengajar: pengajarDisplayName(item.pengajar),
      waktu: `${sessionDateKey(item.tanggal)}, ${item.waktu}`,
      tipe_jadwal: tipeJadwal,
    };
  });
}

function normalizeInstructorName(value?: string | null) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getAssistantNameCandidates(email?: string | null) {
  const localPart = String(email ?? '').split('@')[0] ?? '';
  const normalizedLocal = normalizeInstructorName(localPart);
  const tokens = normalizedLocal.split(' ').filter(Boolean);
  const nonNumericTokens = tokens.filter(token => !/^\d+$/.test(token));

  return Array.from(new Set([
    normalizedLocal,
    tokens[0],
    nonNumericTokens[0],
    nonNumericTokens.join(' '),
  ].filter(Boolean)));
}

function filterSessionsForCurrentAssistant(items: SessionFromAPI[], email?: string | null) {
  const candidates = getAssistantNameCandidates(email);
  if (candidates.length === 0) return [];

  return items.filter(item => {
    const instructors = String(item.pengajar ?? '')
      .split('&')
      .map(part => normalizeInstructorName(part))
      .filter(Boolean);

    return instructors.some(name =>
      candidates.some(candidate =>
        name === candidate ||
        name.includes(candidate) ||
        candidate.includes(name) ||
        name.split(' ').includes(candidate),
      ),
    );
  });
}

function DatePickerField({
  label,
  value,
  min,
  max,
  onChange,
  hideLabel = false,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  hideLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseLocalDate(value));
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const minDate = min ? parseLocalDate(min) : null;
  const maxDate = max ? parseLocalDate(max) : null;
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const offset = monthStart.getDay();
  const days = Array.from({ length: monthEnd.getDate() }, (_, i) => new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1));

  const changeMonth = (delta: number) => {
    setViewDate(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const pickDate = (date: Date) => {
    onChange(toIsoDateFromDate(date));
    setViewDate(date);
    setOpen(false);
  };

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setAlignRight(rect.left + 280 > window.innerWidth - 8);
    }
    setOpen(true);
  };

  return (
    <div className="relative">
      <label className={`${hideLabel ? 'sr-only' : 'block'} text-[10px] md:text-[11px] font-bold text-slate-400/90 tracking-widest uppercase mb-2.5 ml-1`}>
        {label}
      </label>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
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
          <div className={`absolute top-[calc(100%+8px)] z-40 w-[280px] bg-white border border-slate-100 rounded-[20px] p-4 shadow-xl ${alignRight ? 'right-0' : 'left-0'}`}>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-sm font-bold text-slate-800 capitalize">
                {viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50"
              >
                <ChevronRight size={16} />
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
              {Array.from({ length: offset }).map((_, index) => <div key={index} />)}
              {days.map(day => {
                const iso = toIsoDateFromDate(day);
                const selected = iso === value;
                const disabled =
                  (minDate ? day < minDate : false) ||
                  (maxDate ? day > maxDate : false);
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickDate(day)}
                    className={`h-9 rounded-xl text-xs font-bold transition-all ${
                      selected
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

function ExpandedDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseLocalDate(value));
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (value) setViewDate(parseLocalDate(value));
  }, [value]);

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const offset = monthStart.getDay();
  const days = Array.from({ length: monthEnd.getDate() }, (_, i) =>
    new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1),
  );

  const changeMonth = (delta: number) =>
    setViewDate(c => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  const pickDate = (date: Date) => {
    onChange(toIsoDateFromDate(date));
    setOpen(false);
  };

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.min(rect.left, window.innerWidth - 296);
      setPopupPos({ top: rect.bottom + 8, left: Math.max(8, left) });
    }
    setOpen(v => !v);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:border-slate-300 transition-all active:scale-95"
      >
        <Calendar size={15} className="text-slate-400 shrink-0" />
        <span>{parseLocalDate(value).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[9999] w-[280px] bg-white border border-slate-100 rounded-[20px] p-4 shadow-xl"
            style={{ top: popupPos.top, left: popupPos.left }}
          >
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50">
                <ChevronLeft size={16} />
              </button>
              <p className="text-sm font-bold text-slate-800 capitalize">
                {viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
              <button type="button" onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => (
                <div key={`${day}-${i}`} className="h-7 flex items-center justify-center text-[10px] font-bold text-slate-400">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, i) => <div key={i} />)}
              {days.map(day => {
                const iso = toIsoDateFromDate(day);
                const selected = iso === value;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => pickDate(day)}
                    className={`h-9 rounded-xl text-xs font-bold transition-all ${
                      selected
                        ? 'bg-obsidian text-white'
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
        </>,
        document.body,
      )}
    </>
  );
}

export default function JadwalAjarPage() {
  type ViewType = 'CARD' | 'TABLE';

  const today = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState<ViewMode>('PERSONAL');
  const [viewType, setViewType] = useState<ViewType>('CARD');
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [startDate, setStartDate] = useState(() => toIsoDateFromDate(today));
  const [endDate, setEndDate] = useState(() => toIsoDateFromDate(addDays(today, 6)));
  const [tableDate, setTableDate] = useState(() => toIsoDateFromDate(today));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [sessions, setSessions] = useState<SessionFromAPI[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useUserStore(state => state.user);

  const { jadwalAjarCache, setJadwalAjarCache } = useJadwalStore();

  const maxEndDate = toIsoDateFromDate(addDays(parseLocalDate(startDate), 6));

  useEffect(() => {
    let cancelled = false;
    async function fetchInitialData() {
      try {
        const [semesterRes, roomRes] = await Promise.all([
          getSemesterList(1, '', 50),
          getRuanganList(1, '', 200),
        ]);
        if (cancelled) return;

        const semesterItems = semesterRes.success ? semesterRes.data?.items ?? [] : [];
        if (semesterItems.length > 0) {
          setSelectedSemesterId(semesterItems[0].id);
        } else {
          setIsLoading(false);
        }

        if (roomRes.success) {
          const roomItems = roomRes.data?.items ?? [];
          setRooms(
            roomItems
              .map(room => `${room.nama_ruangan} (Lantai ${room.lantai})`)
              .sort((a, b) => a.localeCompare(b, 'id-ID')),
          );
        }
      } catch {
        if (!cancelled) {
          setError('Gagal memuat data semester atau ruangan.');
          setIsLoading(false);
        }
      }
    }

    fetchInitialData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedSemesterId) return;
    let cancelled = false;

    const cacheKey = `${user?.id_asisten ?? user?.email ?? 'guest'}-${viewMode}-${selectedSemesterId}-${startDate}-${endDate}`;
    const cached = jadwalAjarCache[cacheKey];
    if (cached) {
      setSessions(cached);
      setIsLoading(false);
      return;
    }

    async function fetchSchedule() {
      setIsLoading(true);
      setError(null);
      try {
        const params = { start_date: startDate, end_date: endDate, id_semester: selectedSemesterId };
        const res = viewMode === 'PERSONAL'
          ? await getMyScheduleTimeline(params)
          : await getScheduleTimeline(params);

        if (cancelled) return;
        if (res.success) {
          let mapped = mapTimelineItems(res.data?.items || []);

          if (viewMode === 'PERSONAL' && mapped.length === 0) {
            const fallbackRes = await getScheduleTimeline(params);
            if (cancelled) return;
            if (fallbackRes.success) {
              mapped = filterSessionsForCurrentAssistant(
                mapTimelineItems(fallbackRes.data?.items || []),
                user?.email,
              );
            }
          }

          setSessions(mapped);
          setJadwalAjarCache(cacheKey, mapped);
        } else {
          setSessions([]);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setSessions([]);
          setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat jadwal.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchSchedule();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedSemesterId, viewMode, user?.email, user?.id_asisten]);

  const handleTableDateChange = (value: string) => {
    setTableDate(value);
    setStartDate(value);
    setEndDate(value);
  };

  const handleViewTypeChange = (type: ViewType) => {
    setViewType(type);
    if (type === 'TABLE') {
      setStartDate(tableDate);
      setEndDate(tableDate);
    } else {
      setStartDate(tableDate);
      setEndDate(toIsoDateFromDate(addDays(parseLocalDate(tableDate), 6)));
    }
  };

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



  const filtered = sessions.filter(s =>
    deriveStatus(s.waktu) !== 'Selesai' &&
    (s.mata_kuliah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ruangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.pengajar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.nama_kelas && s.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (filterStatus === 'ALL' || deriveStatus(s.waktu) === filterStatus)
  );

  const grouped = filtered.reduce<Record<string, SessionFromAPI[]>>((acc, session) => {
    const key = getSessionIso(session.waktu);
    acc[key] = [...(acc[key] || []), session];
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(grouped).sort();

  const timetableData = useMemo(() => {
    if (viewType !== 'TABLE') return null;
    const daySessions = sessions.filter(s => getSessionIso(s.waktu) === tableDate);
    const roomSet = new Set<string>();
    const lookup: Record<number, Record<string, SessionFromAPI>> = {};
    daySessions.forEach(s => {
      if (s.ruangan) roomSet.add(s.ruangan);
      const t = s.waktu.split(', ')[1] ?? '';
      const slot = opsiJamFromWaktu(t);
      if (!lookup[slot]) lookup[slot] = {};
      lookup[slot][s.ruangan] = s;
    });
    const tableRooms = rooms.length > 0 ? rooms : Array.from(roomSet).sort();
    return { jams: JAM_OPTIONS, rooms: tableRooms, lookup, daySessions };
  }, [sessions, viewType, tableDate, rooms]);

  const ScheduleCard = ({ s, gridMode = false }: { s: SessionFromAPI; gridMode?: boolean }) => {
    const timePart = s.waktu.split(', ')[1] ?? s.waktu;

    return (
      <section className="bg-white rounded-[12px] md:rounded-[32px] p-5 md:p-6 border border-slate-100 flex flex-col gap-5 w-full">
        <article className={`flex flex-col ${!gridMode ? 'md:flex-row md:justify-between md:items-center' : 'flex-1'} gap-5`}>
          <div className={`flex flex-col gap-1 w-full ${!gridMode ? 'md:w-1/3' : 'flex-1'}`}>
            <h2 className={`font-bold text-slate-900 leading-snug line-clamp-2 mb-1 ${gridMode ? 'text-sm md:text-base' : 'text-xl md:text-2xl'}`}>
              {s.mata_kuliah}
            </h2>
            <p className={`text-slate-500 font-medium ${gridMode ? 'text-[11px] md:text-xs' : 'text-sm'}`}>{s.nama_kelas || 'Kelas tidak tersedia'}</p>
          </div>

          <div className={`grid w-full ${gridMode ? 'grid-cols-1 gap-y-2.5 border-t border-slate-100 pt-3 md:grid-cols-2 md:gap-x-6 md:gap-y-4 md:border-t-0 md:pt-0' : 'grid-cols-2 gap-x-6 gap-y-4 md:w-[480px]'}`}>
            <div className={`flex flex-col gap-0.5 ${!gridMode ? 'border-l-2 border-slate-100 pl-4' : 'md:border-l-2 md:border-slate-100 md:pl-4'}`}>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
              <span className={`font-bold text-slate-800 ${gridMode ? 'text-xs md:text-xs' : 'text-sm md:text-base'}`}>{formatDisplayDate(getSessionIso(s.waktu))}</span>
            </div>
            <div className={`flex flex-col gap-0.5 ${!gridMode ? 'border-l-2 border-slate-100 pl-4' : 'md:border-l-2 md:border-slate-100 md:pl-4'}`}>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
              <span className={`font-bold text-slate-800 ${gridMode ? 'text-xs md:text-xs' : 'text-sm md:text-base'}`}>{timePart}</span>
            </div>
            <div className={`flex flex-col gap-0.5 ${!gridMode ? 'border-l-2 border-slate-100 pl-4' : 'md:border-l-2 md:border-slate-100 md:pl-4'}`}>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ruangan</span>
              <span className={`font-bold text-slate-800 ${gridMode ? 'text-xs md:text-xs' : 'text-sm md:text-base'}`}>{s.ruangan}</span>
            </div>
            <div className={`flex flex-col gap-0.5 ${!gridMode ? 'border-l-2 border-slate-100 pl-4' : 'md:border-l-2 md:border-slate-100 md:pl-4'}`}>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengajar</span>
              <span className={`font-bold text-slate-800 ${gridMode ? 'text-xs md:text-xs' : 'text-sm md:text-base'}`}>{s.pengajar || '-'}</span>
            </div>
          </div>
        </article>
      </section>
    );
  };

  const LoadingState = () => (
    <div className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 border border-slate-100 flex flex-col gap-6 w-full animate-pulse">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-3 w-full md:w-1/3">
          <div className="h-6 md:h-8 w-3/4 rounded-lg bg-slate-100" />
          <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 md:flex gap-4 md:gap-8 w-full md:w-auto">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="border-l-2 border-slate-100 pl-4 space-y-2">
              <div className="h-3 w-14 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="h-9 w-24 rounded-xl bg-slate-100 mt-2 md:mt-0" />
      </div>
      <p className="sr-only">Memuat jadwal...</p>
    </div>
  );

  return (
    <AsdosPageShell>
      <AsdosPageHeader
        eyebrow="Jadwal Mengajar"
        title="Agenda Ajar"
        description="Timeline mingguan jadwal asistensi Anda."
        action={
          <div className="flex gap-3 relative z-20 w-full md:w-auto md:min-w-[380px]">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-[18px] h-[18px] md:w-5 md:h-5" />
              </div>
              <input
                type="text"
                placeholder="Cari mata kuliah, kelas, ruangan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 text-sm md:text-base rounded-[14px] md:rounded-3xl pl-11 md:pl-14 pr-10 py-3.5 md:py-4 focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Bersihkan pencarian"
                  className="absolute inset-y-0 right-3 flex items-center text-slate-300 hover:text-slate-500"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <CustomSelect
              value={filterStatus}
              onChange={(val) => setFilterStatus(val as FilterStatus)}
              options={[
                { value: 'ALL', label: 'Semua Status' },
                { value: 'Mendatang', label: 'Mendatang' },
                { value: 'Berjalan', label: 'Berjalan' },
              ]}
              variant="icon"
              icon={<Filter className="w-[18px] h-[18px] md:w-5 md:h-5" />}
              align="right"
              triggerClassName={filterStatus !== 'ALL' ? 'bg-red-50 border-crimson text-crimson' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}
            />
          </div>
        }
      />

      <div className="mb-6 flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4">
          {viewType === 'TABLE' ? (
            <div className="w-full md:w-52">
              <DatePickerField label="Tanggal" value={tableDate} onChange={handleTableDateChange} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:flex md:gap-3">
              <div className="md:w-44">
                <DatePickerField label="Dari Tanggal" value={startDate} onChange={handleStartDateChange} />
              </div>
              <div className="md:w-44">
                <DatePickerField label="Sampai Tanggal" value={endDate} min={startDate} max={maxEndDate} onChange={handleEndDateChange} />
              </div>
            </div>
          )}
          <div className="flex gap-2 items-center w-full md:w-auto md:shrink-0">
            <div className="flex bg-slate-100 p-0.5 rounded-xl w-full md:w-[260px] shrink-0">
              {(['PERSONAL', 'ALL'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode);
                    handleViewTypeChange(mode === 'ALL' ? 'TABLE' : 'CARD');
                  }}
                  className={`flex-1 h-[46px] flex items-center justify-center gap-1.5 px-3 rounded-[10px] text-xs font-semibold transition-all ${
                    viewMode === mode ? 'bg-white text-crimson shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {mode === 'PERSONAL' ? <User size={14} /> : <Users size={14} />}
                  {mode === 'PERSONAL' ? 'Jadwal Saya' : 'Semua Jadwal'}
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
        </div>

        {viewType === 'CARD' && (
          <p className="text-xs font-medium text-slate-400 ml-1 -mt-1">
            Pilih rentang tanggal maksimal 7 hari.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6 w-full pb-8">
        {error ? (
          <AsdosState variant="error" message={error} />
        ) : isLoading ? (
          viewType === 'TABLE' ? (
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-shimmer">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      {['Jam', 'Ruangan 1', 'Ruangan 2', 'Ruangan 3'].map(h => (
                        <th key={h} className="px-4 py-3"><div className="h-3 bg-slate-100 rounded w-16 mx-auto" /></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-4 py-4"><div className="h-3 bg-slate-100 rounded w-20" /></td>
                        {[...Array(3)].map((_, j) => (
                          <td key={j} className="px-3 py-4">
                            <div className={`h-14 bg-slate-100 rounded-lg ${j === 1 ? 'opacity-100' : 'opacity-40'}`} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <LoadingState />
          )
        ) : viewType === 'TABLE' ? (
          timetableData && timetableData.rooms.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="overflow-auto max-h-[70vh]">
                <table className="w-full">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="px-3 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[110px] border-r border-slate-100">
                        Jam
                      </th>
                      {timetableData.rooms.map(room => (
                        <th key={room} className="px-3 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
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
                          const isRunning = deriveStatus(s.waktu) === 'Berjalan';
                          return (
                            <td key={room} className="px-2 py-2">
                              <div className={`rounded-lg px-3 py-2.5 text-center transition-all ${
                                isRunning ? 'bg-crimson/10 border border-crimson/20' : 'bg-slate-50 border border-slate-100'
                              }`}>
                                <p className={`text-xs font-bold leading-snug line-clamp-2 ${isRunning ? 'text-crimson' : 'text-slate-700'}`}>
                                  {s.mata_kuliah}
                                </p>
                                {s.nama_kelas && (
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{s.nama_kelas}</p>
                                )}
                                <div className="flex items-center justify-center gap-1 mt-1.5">
                                  <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <p className="text-[10px] text-slate-400 truncate">{s.pengajar || '-'}</p>
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
            <div className="bg-white border border-slate-100 rounded-xl p-8 text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-[14px] bg-fog flex items-center justify-center text-slate-400">
                <Table2 size={20} />
              </div>
              <p className="text-base font-bold text-slate-700">Tidak ada jadwal hari ini.</p>
              <p className="text-sm text-slate-400 mt-1">Pilih tanggal lain untuk melihat jadwal.</p>
            </div>
          )
        ) : filtered.length > 0 ? (
          <>
            {sortedDateKeys.map(dateKey => (
              <div key={dateKey} className="flex flex-col gap-3">
                <div className="flex items-center px-1">
                  <h3 className="text-sm font-bold text-slate-800">{formatDisplayDate(dateKey)}</h3>
                </div>
                {viewMode === 'ALL' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {grouped[dateKey].map(s => <ScheduleCard key={`${s.id_sesi}-${s.waktu}`} s={s} gridMode />)}
                  </div>
                ) : (
                  grouped[dateKey].map(s => <ScheduleCard key={`${s.id_sesi}-${s.waktu}`} s={s} />)
                )}
              </div>
            ))}

            <p className="text-xs font-medium text-slate-400 text-center mt-2">
              Menampilkan {filtered.length} jadwal.
            </p>
          </>
        ) : (
          <>
            <div className="bg-white border border-slate-100 rounded-[12px] md:rounded-[32px] p-6 md:p-8 text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-[14px] bg-fog flex items-center justify-center text-slate-500">
                <Search size={20} />
              </div>
              <p className="text-base md:text-lg text-slate-800 font-bold">
                {sessions.length > 0 ? 'Jadwal tidak ditemukan.' : 'Tidak ada jadwal.'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {sessions.length > 0
                  ? 'Coba ubah kata kunci pencarian atau filter status.'
                  : 'Pilih rentang tanggal lain untuk melihat jadwal.'}
              </p>
            </div>

            <p className="text-xs font-medium text-slate-400 text-center mt-2">
              Menampilkan 0 jadwal.
            </p>
          </>
        )}
      </div>

      {isTableExpanded && timetableData && typeof document !== 'undefined' ? createPortal(
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200]" onClick={() => setIsTableExpanded(false)} />
          <div className="fixed inset-4 md:inset-8 z-[201] bg-white rounded-[12px] shadow-2xl flex flex-col overflow-hidden text-slate-800">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
              <ExpandedDatePicker value={tableDate} onChange={handleTableDateChange} />
              <button type="button" onClick={() => setIsTableExpanded(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-crimson hover:border-crimson/30 transition-all active:scale-95">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-auto flex-1">
              {timetableData.rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <Table2 size={32} />
                  <p className="text-sm font-semibold">Tidak ada jadwal hari ini.</p>
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
                          const isRunning = deriveStatus(s.waktu) === 'Berjalan';
                          return (
                            <td key={room} className="px-3 py-3">
                              <div className={`rounded-xl px-4 py-3 text-center transition-all ${
                                isRunning ? 'bg-crimson/10 border border-crimson/20' : 'bg-slate-50 border border-slate-100'
                              }`}>
                                <p className={`text-sm font-bold leading-snug line-clamp-2 ${isRunning ? 'text-crimson' : 'text-slate-700'}`}>
                                  {s.mata_kuliah}
                                </p>
                                {s.nama_kelas && <p className="text-xs text-slate-400 font-medium mt-0.5">{s.nama_kelas}</p>}
                                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <p className="text-xs text-slate-400 truncate">{s.pengajar || '-'}</p>
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
