'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, MapPin, BookOpen, Users, User, X } from 'lucide-react';
import { getMyScheduleTimeline, getScheduleTimeline, type SessionFromAPI } from '@/lib/actions/jadwal';
import { getSemesterList } from '@/lib/actions/data-master';
import type { SemesterItem, UnifiedJadwalResponse } from '@/types/api';
import { useJadwalStore } from '@/store/useJadwalStore';
import { AsdosListSkeleton, AsdosPageHeader, AsdosPageShell } from '@/components/dashboard/asdos/AsdosUI';
import {
  getMonthBounds,
  parseIsoDateLocal,
  sessionDateKey,
  todayIso,
  toIsoDate,
  toIsoDateFromDate,
} from '@/lib/jadwal-utils';

const DAY_NAMES_SHORT = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];
const DAY_NAMES_FULL = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
function deriveStatus(waktu: string): 'Berjalan' | 'Selesai' {
  const endTime = waktu.split(', ')[1]?.split(' - ')[1]?.trim();
  if (!endTime || endTime === '--:--') return 'Berjalan';
  const [h, m] = endTime.split(':').map(Number);
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  return now >= end ? 'Selesai' : 'Berjalan';
}

function getMonday(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day));
  return copy;
}

export default function JadwalAjarPage() {
  const [viewMode, setViewMode] = useState<'PERSONAL' | 'ALL'>('PERSONAL');
  const [semesterList, setSemesterList] = useState<SemesterItem[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Berjalan' | 'Selesai'>('ALL');

  const {
    personalSessions, allSessions, fetchedMonthsPersonal, fetchedMonthsAll,
    currentYear, currentMonth, selectedDate, isLoading, error,
    addPersonalSessions, addAllSessions, markMonthFetched,
    setCalendar, setSelectedDate, setIsLoading, setError,
  } = useJadwalStore();

  useEffect(() => {
    getSemesterList(1, '', 50).then(res => {
      if (res.success && res.data?.items) {
        setSemesterList(res.data.items);
        if (res.data.items.length > 0) setSelectedSemesterId(res.data.items[0].id);
      }
    });
  }, []);


  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const gridOffset  = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const monthLabel  = new Date(currentYear, currentMonth, 1)
    .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentYear, currentMonth, i + 1);
    const mondayFirstIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return {
      date: (i + 1).toString(),
      dayGrid: DAY_NAMES_SHORT[mondayFirstIndex],
      dayFull: DAY_NAMES_FULL[date.getDay()],
    };
  });

  const selectedIso = toIsoDate(currentYear, currentMonth, parseInt(selectedDate, 10));


  useEffect(() => {
    if (!selectedSemesterId) return;
    let cancelled = false;

    const fetchMonthData = async () => {
      const { start_date: startStr, end_date: endStr } = getMonthBounds(currentYear, currentMonth);
      const monthKey = `${currentYear}-${currentMonth}-${selectedSemesterId}`;

      const fetchPersonal = !fetchedMonthsPersonal[monthKey];
      const fetchAll      = viewMode === 'ALL' && !fetchedMonthsAll[monthKey];
      if (!fetchPersonal && !fetchAll) { setIsLoading(false); return; }

      setIsLoading(true);
      setError(null);

      try {
        const [resPersonal, resAll] = await Promise.all([
          fetchPersonal
            ? getMyScheduleTimeline({ start_date: startStr, end_date: endStr, id_semester: selectedSemesterId })
            : Promise.resolve(null),
          fetchAll
            ? getScheduleTimeline({ start_date: startStr, end_date: endStr, id_semester: selectedSemesterId })
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        const mapItems = (items: UnifiedJadwalResponse[]): SessionFromAPI[] =>
          items.map(item => ({
            id_sesi: item.id_sesi,
            nama_kelas: item.nama_kelas,
            mata_kuliah: item.mata_kuliah,
            ruangan: item.ruangan,
            pengajar: item.pengajar,
            waktu: `${sessionDateKey(item.tanggal)}, ${item.waktu}`,
            tipe_jadwal: (item.tipe === 'REGULAR' || item.tipe === 'REGULER') ? 'REGULAR' : 'PENGGANTI',
          }));

        if (fetchPersonal && resPersonal?.success && resPersonal.data) {
          addPersonalSessions(mapItems(resPersonal.data.items || []));
          markMonthFetched(monthKey, 'PERSONAL');
        } else if (fetchPersonal && resPersonal && !resPersonal.success) {
          setError(resPersonal.message ?? 'Gagal memuat jadwal personal');
        }

        if (fetchAll && resAll?.success && resAll.data) {
          addAllSessions(mapItems(resAll.data.items || []));
          markMonthFetched(monthKey, 'ALL');
        } else if (fetchAll && resAll && !resAll.success) {
          setError(resAll.message ?? 'Gagal memuat semua jadwal');
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchMonthData();
    return () => { cancelled = true; };
  }, [currentYear, currentMonth, selectedSemesterId, viewMode,
      fetchedMonthsPersonal, fetchedMonthsAll, addPersonalSessions, addAllSessions,
      markMonthFetched, setError, setIsLoading]);


  const handlePrevMonth = () =>
    currentMonth === 0 ? setCalendar(currentYear - 1, 11, '1') : setCalendar(currentYear, currentMonth - 1, '1');
  const handleNextMonth = () =>
    currentMonth === 11 ? setCalendar(currentYear + 1, 0, '1') : setCalendar(currentYear, currentMonth + 1, '1');
  const setCalendarFromDate = (d: Date) =>
    setCalendar(d.getFullYear(), d.getMonth(), String(d.getDate()));
  const handlePrevWeek = () => {
    const d = new Date(currentYear, currentMonth, parseInt(selectedDate, 10));
    d.setDate(d.getDate() - 7); setCalendarFromDate(d);
  };
  const handleNextWeek = () => {
    const d = new Date(currentYear, currentMonth, parseInt(selectedDate, 10));
    d.setDate(d.getDate() + 7); setCalendarFromDate(d);
  };


  const getSessionIso = (waktu: string) => sessionDateKey(waktu.split(',')[0] ?? '');
  const personalDates = new Set(personalSessions.map(s => getSessionIso(s.waktu)));
  const allDates      = new Set(allSessions.map(s => getSessionIso(s.waktu)));

  const hasDot = (date: string) => {
    const iso = toIsoDate(currentYear, currentMonth, parseInt(date, 10));
    if (viewMode === 'ALL') return allDates.has(iso) || personalDates.has(iso);
    return personalDates.has(iso);
  };

  const isMyDot = (date: string) => {
    const iso = toIsoDate(currentYear, currentMonth, parseInt(date, 10));
    return personalDates.has(iso);
  };


  const currentSessions  = viewMode === 'PERSONAL' ? personalSessions : allSessions;
  const selectedDateObj  = new Date(currentYear, currentMonth, parseInt(selectedDate, 10));
  const weekStart        = getMonday(selectedDateObj);
  const weekDays         = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    return {
      iso:       toIsoDateFromDate(d),
      date:      String(d.getDate()),
      dayMobile: DAY_NAMES_FULL[d.getDay()],
      label:     d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short' }),
    };
  });
  const weekIsoSet       = new Set(weekDays.map(d => d.iso));
  const sessionsForWeek  = currentSessions.filter(s => weekIsoSet.has(getSessionIso(s.waktu)));
  const filtered         = sessionsForWeek.filter(s =>
    (s.mata_kuliah.toLowerCase().includes(searchTerm.toLowerCase()) ||
     s.ruangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (s.nama_kelas && s.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (filterStatus === 'ALL' || deriveStatus(s.waktu) === filterStatus)
  );
  const groupedWeek      = weekDays.map(day => ({
    ...day,
    sessions: filtered.filter(s => getSessionIso(s.waktu) === day.iso),
  }));
  const isSemesterLoading  = semesterList.length === 0;


  const ScheduleCard = ({ s }: { s: SessionFromAPI }) => {
    const status   = deriveStatus(s.waktu);
    const timePart = s.waktu.split(', ')[1] ?? s.waktu;
    const [timeStart, timeEnd] = timePart.split(' - ');
    const isPengganti = s.tipe_jadwal === 'PENGGANTI';

    return (
      <div className="group relative bg-white border border-slate-100 rounded-2xl p-4 md:p-5 hover:border-slate-200 hover:shadow-sm transition-all duration-200 overflow-hidden">
        <div className={`absolute left-0 inset-y-0 w-[3px] rounded-r-full ${isPengganti ? 'bg-amber-400' : 'bg-[#941C2F]'}`} />

        <div className="flex items-start gap-4">
          <div className="shrink-0 text-right min-w-[52px]">
            <p className="text-[13px] font-bold text-slate-800 tabular-nums">{timeStart}</p>
            {timeEnd && <p className="text-[11px] text-slate-400 font-medium tabular-nums">{timeEnd}</p>}
          </div>

          <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
            <div className={`w-2 h-2 rounded-full ${isPengganti ? 'bg-amber-400' : 'bg-[#941C2F]'}`} />
            <div className="w-px flex-1 bg-slate-100 min-h-[32px]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-[14px] text-slate-800 truncate">{s.mata_kuliah}</h3>
                  {isPengganti && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-md tracking-wider">
                      PENGGANTI
                    </span>
                  )}
                </div>
                {s.nama_kelas && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{s.nama_kelas}</p>
                )}
              </div>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg tracking-wide ${
                status === 'Berjalan'
                  ? 'bg-blue-50 text-blue-500'
                  : 'bg-emerald-50 text-emerald-600'
              }`}>
                {status}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-500">
              <div className="flex items-center gap-1">
                <User size={11} className="shrink-0" />
                <span className="text-xs truncate max-w-[120px]">{s.pengajar}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={11} className="shrink-0" />
                <span className="text-xs">{s.ruangan}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LoadingState = ({ label }: { label: string }) => (
    <div className="space-y-3">
      <AsdosListSkeleton count={4} />
      <p className="sr-only">{label}</p>
    </div>
  );

  const searchAndFilter = (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 md:p-4 shadow-sm mb-5 md:mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari mata kuliah, kelas, atau ruangan"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/70 text-sm font-medium text-slate-800 rounded-xl pl-11 pr-10 py-3 focus:outline-none focus:bg-white focus:border-[#941C2F]/40 focus:ring-2 focus:ring-[#941C2F]/10 transition placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              aria-label="Bersihkan pencarian"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5 md:flex md:shrink-0">
          {(['ALL', 'Berjalan', 'Selesai'] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === status
                  ? 'bg-[#941C2F] text-white shadow-sm shadow-[#941C2F]/20'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {status === 'ALL' ? 'Semua' : status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <AsdosPageShell>
      <div className="px-4 md:px-0 py-6 md:py-0">
        <AsdosPageHeader
          eyebrow="Jadwal Mengajar"
          title="Agenda Ajar"
          description="Timeline mingguan jadwal asistensi Anda."
          action={
            viewMode === 'ALL' ? (
              <div className="relative sm:min-w-[240px]">
                <select
                  value={selectedSemesterId}
                  onChange={e => setSelectedSemesterId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#941C2F] focus:border-[#941C2F] appearance-none cursor-pointer pr-8 transition"
                >
                  {semesterList.map(s => (
                    <option key={s.id} value={s.id}>{s.tahun_ajaran} — {s.tipe_semester}</option>
                  ))}
                </select>
                <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
              </div>
            ) : null
          }
        />

        {searchAndFilter}

        <div className="md:hidden mb-4">
          <div className="flex bg-slate-100 p-0.5 rounded-xl w-full">
            {(['PERSONAL', 'ALL'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-semibold transition-all ${
                  viewMode === mode ? 'bg-white text-[#941C2F] shadow-sm' : 'text-slate-400'
                }`}
              >
                {mode === 'PERSONAL' ? <User size={12} /> : <Users size={12} />}
                {mode === 'PERSONAL' ? 'Jadwal Saya' : 'Semua Jadwal'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5 lg:gap-6 items-start">

          <div className="hidden md:flex flex-col gap-4 w-[280px] lg:w-[300px] shrink-0 sticky top-8">

            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800 capitalize">{monthLabel}</h2>
                <div className="flex gap-1">
                  {[handlePrevMonth, handleNextMonth].map((fn, i) => (
                    <button key={i} onClick={fn}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition">
                      {i === 0 ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DAY_NAMES_SHORT.map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-slate-300">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: gridOffset }).map((_, i) => <div key={`sp-${i}`} />)}
                {calendarDays.map(item => {
                  const sel     = selectedDate === item.date;
                  const today   = todayIso() === toIsoDate(currentYear, currentMonth, parseInt(item.date, 10));
                  const dotShow = hasDot(item.date);
                  const dotMine = isMyDot(item.date);
                  return (
                    <div key={item.date} onClick={() => setSelectedDate(item.date)}
                      className="flex flex-col items-center cursor-pointer py-0.5 group">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all
                        ${sel
                          ? 'bg-[#941C2F] text-white'
                          : today
                          ? 'border border-[#941C2F]/30 text-[#941C2F]'
                          : 'text-slate-600 group-hover:bg-slate-50'
                        }`}>
                        {item.date}
                      </div>
                      <div className={`w-1 h-1 rounded-full mt-0.5 transition-all ${
                        dotShow ? (dotMine ? 'bg-[#941C2F]' : 'bg-slate-400') : 'bg-transparent'
                      }`} />
                    </div>
                  );
                })}
              </div>

              <div className="flex bg-slate-50 p-0.5 rounded-xl mt-5">
                {(['PERSONAL', 'ALL'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[11px] font-semibold transition-all ${
                      viewMode === mode ? 'bg-white text-[#941C2F] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}>
                    {mode === 'PERSONAL' ? <User size={11} /> : <Users size={11} />}
                    {mode === 'PERSONAL' ? 'Jadwal Saya' : 'Semua'}
                  </button>
                ))}
              </div>
            </div>

          </div>
          <div className="flex-1 w-full min-w-0">
            <div className="md:hidden space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <button onClick={handlePrevWeek} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 bg-white shrink-0">
                  <ChevronLeft size={14} />
                </button>
                <div className="flex gap-1.5 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                  {weekDays.map(item => {
                    const sel     = selectedIso === item.iso;
                    const hasSess = currentSessions.some(s => getSessionIso(s.waktu) === item.iso);
                    return (
                      <div key={item.iso}
                        onClick={() => setCalendarFromDate(parseIsoDateLocal(item.iso))}
                        className={`flex flex-col items-center min-w-[40px] py-2 px-1.5 rounded-xl cursor-pointer transition-all shrink-0 ${
                          sel ? 'bg-[#941C2F] text-white' : 'bg-white border border-slate-100 text-slate-500'
                        }`}>
                        <span className={`text-[9px] font-bold tracking-wider ${sel ? 'text-white/70' : 'text-slate-400'}`}>{item.dayMobile}</span>
                        <span className="text-sm font-bold mt-0.5">{item.date}</span>
                        <div className={`w-1 h-1 rounded-full mt-1 ${hasSess ? sel ? 'bg-white/70' : 'bg-[#941C2F]' : 'bg-transparent'}`} />
                      </div>
                    );
                  })}
                </div>
                <button onClick={handleNextWeek} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 bg-white shrink-0">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Timeline Jadwal</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {weekDays[0]?.label} – {weekDays[6]?.label}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={handlePrevWeek} className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={handleNextWeek} className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {isSemesterLoading && <LoadingState label="Memuat data semester..." />}
            {!isSemesterLoading && isLoading && <LoadingState label="Memuat jadwal..." />}

            {error && !isLoading && !isSemesterLoading && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-500 font-medium">
                {error}
              </div>
            )}

            {!isLoading && !isSemesterLoading && !error && (
              <>
                {filtered.length > 0 ? (
                  <div className="space-y-5 md:space-y-6">
                    {groupedWeek.filter(day => day.sessions.length > 0).map(day => (
                      <section key={day.iso}>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#941C2F] tracking-widest uppercase">{day.dayMobile}</span>
                            <h4 className="text-sm font-bold text-slate-800">{day.label}</h4>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                            {day.sessions.length} sesi
                          </span>
                        </div>
                        <div className="space-y-2">
                          {day.sessions.map(s => <ScheduleCard key={`${s.id_sesi}-${s.waktu}`} s={s} />)}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                    <p className="text-slate-500 font-medium">Tidak ada jadwal.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {viewMode === 'PERSONAL'
                        ? 'Tidak ada sesi yang dijadwalkan pada minggu ini.'
                        : 'Tidak ada sesi untuk seluruh asisten minggu ini.'}
                    </p>
                  </div>
                )}

                <p className="text-[11px] text-slate-300 mt-5 text-center md:text-left">
                  {filtered.length} jadwal ditampilkan
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </AsdosPageShell>
  );
}
