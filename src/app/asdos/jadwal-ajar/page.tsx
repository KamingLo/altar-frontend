'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, Search, User, Users, X } from 'lucide-react';
import { getMyScheduleTimeline, getScheduleTimeline, type SessionFromAPI } from '@/lib/actions/jadwal';
import { getSemesterList } from '@/lib/actions/data-master';
import type { UnifiedJadwalResponse } from '@/types/api';
import { AsdosPageHeader, AsdosPageShell, AsdosState } from '@/components/dashboard/asdos/AsdosUI';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { sessionDateKey, toIsoDateFromDate } from '@/lib/jadwal-utils';

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
  return items.map(item => ({
    id_sesi: item.id_sesi,
    nama_kelas: item.nama_kelas,
    mata_kuliah: item.mata_kuliah,
    ruangan: item.ruangan,
    pengajar: item.pengajar,
    waktu: `${sessionDateKey(item.tanggal)}, ${item.waktu}`,
    tipe_jadwal: (item.tipe === 'REGULAR' || item.tipe === 'REGULER') ? 'REGULAR' : 'PENGGANTI',
  }));
}

function DatePickerField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseLocalDate(value));
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

  return (
    <div className="relative">
      <label className="block text-[10px] md:text-[11px] font-bold text-slate-400/90 tracking-widest uppercase mb-2.5 ml-1">
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
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 bg-white border border-slate-100 rounded-[20px] p-4 shadow-xl">
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

export default function JadwalAjarPage() {
  const today = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState<ViewMode>('PERSONAL');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [startDate, setStartDate] = useState(() => toIsoDateFromDate(today));
  const [endDate, setEndDate] = useState(() => toIsoDateFromDate(addDays(today, 6)));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [sessions, setSessions] = useState<SessionFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const maxEndDate = toIsoDateFromDate(addDays(parseLocalDate(startDate), 6));

  useEffect(() => {
    let cancelled = false;
    getSemesterList(1, '', 50).then(res => {
      if (cancelled) return;
      const items = res.success ? res.data?.items ?? [] : [];
      if (items.length > 0) {
        setSelectedSemesterId(items[0].id);
      } else {
        setError(res.message || 'Data semester tidak tersedia.');
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setError('Gagal memuat data semester.');
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedSemesterId) return;
    let cancelled = false;

    async function fetchSchedule() {
      setIsLoading(true);
      setError(null);
      try {
        const params = { start_date: startDate, end_date: endDate, id_semester: selectedSemesterId };
        const res = viewMode === 'PERSONAL'
          ? await getMyScheduleTimeline(params)
          : await getScheduleTimeline(params);

        if (cancelled) return;
        if (res.success && res.data) {
          setSessions(mapTimelineItems(res.data.items || []));
        } else {
          setSessions([]);
          setError(res.message || 'Gagal memuat jadwal.');
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
  }, [startDate, endDate, selectedSemesterId, viewMode]);

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

  const ScheduleCard = ({ s }: { s: SessionFromAPI }) => {
    const status = deriveStatus(s.waktu);
    const cfg = status === 'Berjalan'
      ? { bg: 'bg-fog', text: 'text-ink', label: 'BERJALAN' }
      : { bg: 'bg-obsidian', text: 'text-white', label: status === 'Mendatang' ? 'MENDATANG' : 'SELESAI' };
    const timePart = s.waktu.split(', ')[1] ?? s.waktu;
    const isPengganti = s.tipe_jadwal === 'PENGGANTI';

    return (
      <section className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 border border-slate-100 flex flex-col gap-6 w-full">
        <article className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-1 w-full md:w-1/3">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug line-clamp-2 mb-1">
              {s.mata_kuliah}
            </h2>
            <p className="text-sm text-slate-500 font-medium">{s.nama_kelas || 'Kelas tidak tersedia'}</p>
            {isPengganti && (
              <span className="w-fit mt-2 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-fog text-ink uppercase">
                Pengganti
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-full md:w-[480px]">
            <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
              <span className="text-sm md:text-base font-bold text-slate-800">{formatDisplayDate(getSessionIso(s.waktu))}</span>
            </div>
            <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
              <span className="text-sm md:text-base font-bold text-slate-800">{timePart}</span>
            </div>
            <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ruangan</span>
              <span className="text-sm md:text-base font-bold text-slate-800">{s.ruangan}</span>
            </div>
            <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengajar</span>
              <span className="text-sm md:text-base font-bold text-slate-800">{s.pengajar || '-'}</span>
            </div>
          </div>

          <span className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap mt-2 md:mt-0 ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
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

      <div className="mb-6 flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          <div>
            <DatePickerField label="Dari Tanggal" value={startDate} onChange={handleStartDateChange} />
          </div>
          <div>
            <DatePickerField label="Sampai Tanggal" value={endDate} min={startDate} max={maxEndDate} onChange={handleEndDateChange} />
          </div>
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-xl w-full md:w-auto md:min-w-[280px]">
          {(['PERSONAL', 'ALL'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 h-[52px] flex items-center justify-center gap-1.5 px-3 rounded-[10px] text-xs font-semibold transition-all ${
                viewMode === mode ? 'bg-white text-crimson shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {mode === 'PERSONAL' ? <User size={14} /> : <Users size={14} />}
              {mode === 'PERSONAL' ? 'Jadwal Saya' : 'Semua Jadwal'}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs font-medium text-slate-400 ml-1 -mt-3 mb-6">
        Pilih rentang tanggal maksimal 7 hari.
      </p>

      <div className="flex flex-col gap-6 w-full pb-8">
        {error ? (
          <AsdosState variant="error" message={error} />
        ) : (isLoading || !selectedSemesterId) ? (
          <LoadingState />
        ) : filtered.length > 0 ? (
          <>
            {sortedDateKeys.map(dateKey => (
              <div key={dateKey} className="flex flex-col gap-3">
                <div className="flex items-center px-1">
                  <h3 className="text-sm font-bold text-slate-800">{formatDisplayDate(dateKey)}</h3>
                </div>
                {grouped[dateKey].map(s => <ScheduleCard key={`${s.id_sesi}-${s.waktu}`} s={s} />)}
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
    </AsdosPageShell>
  );
}
