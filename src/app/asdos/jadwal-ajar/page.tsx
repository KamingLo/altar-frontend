'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, Clock, MapPin, BookOpen, Users, User } from 'lucide-react';
import { getMyScheduleTimeline, getScheduleTimeline, type SessionFromAPI } from '@/lib/actions/jadwal';
import { getSemesterList } from '@/lib/actions/data-master';
import type { SemesterItem } from '@/types/api';
import { useJadwalStore } from '@/store/useJadwalStore';
import { AsdosPageShell } from '@/components/dashboard/asdos/AsdosUI';

const dayNamesGrid = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
const dayNamesFull = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

function deriveStatus(waktu: string): 'Berjalan' | 'Selesai' {
  const endTime = waktu.split(', ')[1]?.split(' - ')[1]?.trim();
  if (!endTime || endTime === '--:--') return 'Berjalan';
  const [h, m] = endTime.split(':').map(Number);
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  return now >= end ? 'Selesai' : 'Berjalan';
}

export default function JadwalAjarPage() {
  const [viewMode, setViewMode] = useState<'PERSONAL' | 'ALL'>('PERSONAL');
  const [semesterList, setSemesterList] = useState<SemesterItem[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  
  const {
    personalSessions, allSessions, fetchedMonthsPersonal, fetchedMonthsAll,
    currentYear, currentMonth, selectedDate, isLoading, error,
    addPersonalSessions, addAllSessions, markMonthFetched,
    setCalendar, setSelectedDate, setIsLoading, setError
  } = useJadwalStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Berjalan' | 'Selesai'>('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    getSemesterList(1, '', 50).then(res => {
      if (res.success && res.data?.items) {
        setSemesterList(res.data.items);
        if (res.data.items.length > 0) {
          setSelectedSemesterId(res.data.items[0].id);
        }
      }
    });
  }, []);

  const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate();
  const gridOffset   = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const monthLabel   = new Date(currentYear, currentMonth, 1)
                         .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => ({
    date: (i + 1).toString(),
    dayMobile: dayNamesFull[(gridOffset + i) % 7],
    dayGrid: dayNamesGrid[(gridOffset + i) % 7],
  }));
  const selectedIso  = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(parseInt(selectedDate, 10)).padStart(2, '0')}`;

  useEffect(() => {
    if (!selectedSemesterId) return;

    let cancelled = false;
    const fetchMonthData = async () => {
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      const startStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const endStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
      
      const monthKey = `${currentYear}-${currentMonth}-${selectedSemesterId}`;

      const fetchPersonal = !fetchedMonthsPersonal[monthKey];
      const fetchAll = viewMode === 'ALL' && !fetchedMonthsAll[monthKey];

      if (!fetchPersonal && !fetchAll) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const pPersonal = fetchPersonal 
          ? getMyScheduleTimeline({ start_date: startStr, end_date: endStr, id_semester: selectedSemesterId })
          : Promise.resolve(null);
          
        const pAll = fetchAll
          ? getScheduleTimeline({ start_date: startStr, end_date: endStr, id_semester: selectedSemesterId })
          : Promise.resolve(null);

        const [resPersonal, resAll] = await Promise.all([pPersonal, pAll]);

        if (cancelled) return;

        if (fetchPersonal && resPersonal) {
          if (resPersonal.success && resPersonal.data) {
            const items = (resPersonal.data as any).items || [];
            const mapped = items.map((item: any) => ({
              id_sesi: item.id_sesi,
              nama_kelas: item.nama_kelas,
              mata_kuliah: item.mata_kuliah,
              ruangan: item.ruangan,
              pengajar: item.pengajar,
              waktu: `${item.tanggal}, ${item.waktu}`,
              tipe_jadwal: (item.tipe === 'REGULAR' || item.tipe === 'REGULER') ? 'REGULAR' : 'PENGGANTI'
            }));
            addPersonalSessions(mapped);
            markMonthFetched(monthKey, 'PERSONAL');
          } else if (!resPersonal.success && resPersonal.message && !resPersonal.message.includes('successfully')) {
            setError(resPersonal.message);
          }
        }

        if (fetchAll && resAll) {
          if (resAll.success && resAll.data) {
            const items = (resAll.data as any).items || [];
            const mapped = items.map((item: any) => ({
              id_sesi: item.id_sesi,
              nama_kelas: item.nama_kelas,
              mata_kuliah: item.mata_kuliah,
              ruangan: item.ruangan,
              pengajar: item.pengajar,
              waktu: `${item.tanggal}, ${item.waktu}`,
              tipe_jadwal: (item.tipe === 'REGULAR' || item.tipe === 'REGULER') ? 'REGULAR' : 'PENGGANTI'
            }));
            addAllSessions(mapped);
            markMonthFetched(monthKey, 'ALL');
          } else if (!resAll.success && resAll.message && !resAll.message.includes('successfully')) {
            setError(resAll.message);
          }
        }

      } catch (err: any) {
        if (!cancelled) setError(err.message || 'An error occurred');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchMonthData();
    return () => { cancelled = true; };
  }, [currentYear, currentMonth, selectedSemesterId, viewMode, fetchedMonthsPersonal, fetchedMonthsAll, addPersonalSessions, addAllSessions, markMonthFetched, setError, setIsLoading]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) setCalendar(currentYear - 1, 11, '1');
    else setCalendar(currentYear, currentMonth - 1, '1');
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) setCalendar(currentYear + 1, 0, '1');
    else setCalendar(currentYear, currentMonth + 1, '1');
  };

  const personalDates = new Set(personalSessions.map(s => s.waktu.split(',')[0]));
  const allDates = new Set(allSessions.map(s => s.waktu.split(',')[0]));

  const getDotClass = (date: string) => {
    const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(parseInt(date, 10)).padStart(2, '0')}`;
    const hasPersonal = personalDates.has(iso);
    const hasOther = allDates.has(iso);

    if (viewMode === 'ALL') {
      if (hasPersonal) return 'bg-[#941C2F]';
      if (hasOther) return 'bg-slate-800';
    } else {
      if (hasPersonal) return 'bg-[#941C2F]';
    }
    return 'bg-transparent';
  };

  const currentSessions = viewMode === 'PERSONAL' ? personalSessions : allSessions;
  const sessionsForDate = currentSessions.filter(s => s.waktu.startsWith(selectedIso));
  const filtered = sessionsForDate.filter(s =>
    (s.mata_kuliah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ruangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.nama_kelas && s.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (filterStatus === 'ALL' || deriveStatus(s.waktu) === filterStatus)
  );

  const selectedDayLabel = calendarDays[parseInt(selectedDate, 10) - 1]?.dayMobile ?? '';
  const isSemesterLoading = semesterList.length === 0;

  return (
    <AsdosPageShell>
      <div>


        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          <div>
            <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Jadwal Mengajar</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Jadwal Ajar</h2>
            <p className="text-sm text-slate-500 mt-1 md:text-base">
              {viewMode === 'PERSONAL' ? 'Daftar jadwal mengajar Anda.' : 'Daftar semua jadwal mengajar.'}
            </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-auto">

            <div className="flex bg-slate-100/50 p-1 rounded-2xl self-start">
              <button 
                onClick={() => setViewMode('PERSONAL')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'PERSONAL' ? 'bg-white text-[#941C2F] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <User size={14} />
                Jadwal Saya
              </button>
              <button 
                onClick={() => setViewMode('ALL')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'ALL' ? 'bg-white text-[#941C2F] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Users size={14} />
                Semua Jadwal
              </button>
            </div>

            <div className="flex gap-3 relative z-20 w-full md:min-w-[420px]">
              {viewMode === 'ALL' && (
                <div className="relative shrink-0">
                  <select
                    value={selectedSemesterId}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    className="h-full bg-white border border-slate-200 text-xs font-bold rounded-2xl px-4 py-3.5 md:py-4 focus:outline-none focus:border-[#941C2F] shadow-[0_2px_10px_rgba(0,0,0,0.02)] appearance-none pr-8 cursor-pointer"
                  >
                    {semesterList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.tahun_ajaran} ({s.tipe_semester})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              )}

              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-[18px] h-[18px] md:w-5 md:h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Cari materi atau kelas..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-sm md:text-base rounded-2xl md:rounded-3xl pl-11 md:pl-14 pr-4 py-3.5 md:py-4 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                />
              </div>
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`border p-3.5 md:p-4 rounded-2xl md:rounded-3xl active:scale-95 transition-all flex items-center justify-center
                    ${filterStatus !== 'ALL' ? 'bg-red-50 border-[#941C2F] text-[#941C2F]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <Filter className="w-[18px] h-[18px] md:w-5 md:h-5" />
                </button>
                {showFilterMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                    <div className="absolute right-0 top-[110%] w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-2 overflow-hidden">
                      {(['ALL', 'Berjalan', 'Selesai'] as const).map(s => (
                        <button key={s} onClick={() => { setFilterStatus(s); setShowFilterMenu(false); }}
                          className={`w-full text-left px-5 py-3 text-sm transition-colors ${filterStatus === s ? 'bg-slate-50 text-[#941C2F] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                          {s === 'ALL' ? 'Semua Status' : s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden mb-6 px-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800">{monthLabel}</h3>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <ChevronLeft className="w-[18px] h-[18px]" />
              </button>
              <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <ChevronRight className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
            {calendarDays.map((item) => {
              const sel = selectedDate === item.date;
              return (
                <div key={item.date} onClick={() => setSelectedDate(item.date)}
                  className={`flex flex-col items-center min-w-[64px] py-3.5 rounded-2xl cursor-pointer transition-all duration-200 snap-center shrink-0 border
                    ${sel ? 'bg-[#941C2F] text-white shadow-lg shadow-[#941C2F]/20 border-[#941C2F]' : 'bg-white text-slate-500 border-slate-100'}`}>
                  <span className={`text-[10px] font-bold tracking-widest mb-1 ${sel ? 'text-white/80' : 'text-slate-400'}`}>{item.dayMobile}</span>
                  <span className="text-xl font-bold mb-1">{item.date}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${sel && getDotClass(item.date) !== 'bg-transparent' ? 'bg-white' : getDotClass(item.date)}`} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-4 px-1">
            <h4 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Jadwal Terdaftar</h4>
            <span className="bg-[#941C2F]/10 text-[#941C2F] text-[10px] font-bold px-2.5 py-1 rounded-md">{filtered.length} Sesi</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start px-4 md:px-0">

          <div className="hidden md:block w-[300px] lg:w-[320px] bg-white rounded-[2rem] p-6 md:p-7 shadow-sm border border-slate-100 shrink-0 sticky top-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">{monthLabel}</h2>
              <div className="flex items-center gap-2">
                <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-4 gap-x-1">
              {dayNamesGrid.map((day, i) => (
                <div key={i} className="text-center text-[11px] font-bold text-[#8BA3CB] mb-2">{day}</div>
              ))}
              {Array.from({ length: gridOffset }).map((_, i) => <div key={`sp-${i}`} />)}
              {calendarDays.map((item) => {
                const sel = selectedDate === item.date;
                return (
                  <div key={item.date} onClick={() => setSelectedDate(item.date)}
                    className="flex flex-col items-center justify-center group cursor-pointer">
                    <div className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200
                      ${sel ? 'bg-[#941C2F] text-white shadow-md' : 'bg-transparent text-slate-700 group-hover:bg-slate-100'}`}>
                      <span className="text-sm font-bold">{item.date}</span>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 transition-all ${getDotClass(item.date)}`} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 w-full space-y-3 md:space-y-4">
            <div className="hidden md:block mb-1">
              <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Jadwal Asistensi Anda</h3>
            </div>

            {isSemesterLoading && (
              <div className="flex flex-col items-center justify-center py-12 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-dashed border-slate-200">
                <div className="w-8 h-8 border-4 border-[#941C2F]/20 border-t-[#941C2F] rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-500">Memuat data semester...</p>
              </div>
            )}

            {!isSemesterLoading && isLoading && (
              <div className="flex flex-col items-center justify-center py-12 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-dashed border-slate-200">
                <div className="w-8 h-8 border-4 border-[#941C2F]/20 border-t-[#941C2F] rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-500">Memuat jadwal bulanan...</p>
              </div>
            )}

            {error && !isLoading && !isSemesterLoading && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600 font-semibold text-center">
                Terjadi kesalahan: {error}
              </div>
            )}

            {!isLoading && !isSemesterLoading && !error && filtered.length > 0 && filtered.map(s => {
              const status = deriveStatus(s.waktu);
              const timePart = s.waktu.split(', ')[1] ?? s.waktu;

              return (
                <div key={s.id_sesi} className="bg-white rounded-2xl md:rounded-[1.25rem] p-4 md:px-5 md:py-4 shadow-sm border border-slate-100 md:hover:shadow-md md:hover:border-slate-200 transition-all group">


                  <div className="flex flex-col gap-3 md:hidden">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-white
                           ${s.tipe_jadwal === 'PENGGANTI' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-[#941C2F] to-[#b3273e]'}`}>
                          <BookOpen size={22} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <h3 className="font-bold text-[15px] text-[#1F2937] leading-tight truncate">{s.mata_kuliah}</h3>
                            {s.tipe_jadwal === 'PENGGANTI' && (
                              <span className="shrink-0 text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-md tracking-wider">
                                PENGGANTI
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                            {s.nama_kelas && (
                              <span className="text-xs font-semibold shrink-0">{s.nama_kelas} -</span>
                            )}
                            <User size={12} className="shrink-0" />
                            <p className="text-xs font-semibold truncate">{s.pengajar}</p>
                          </div>
                        </div>
                      </div>
                      <div className={`shrink-0 ml-3 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider
                        ${status === 'Berjalan' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {status}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1 pt-3 border-t border-slate-100">
                      <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700">{timePart}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate">{s.ruangan}</span>
                      </div>
                    </div>
                  </div>


                  <div className="hidden md:flex md:items-start md:justify-between">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-inner mt-0.5
                         ${s.tipe_jadwal === 'PENGGANTI' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-[#941C2F] to-[#b3273e]'}`}>
                        <BookOpen size={24} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base text-[#1F2937] truncate">{s.mata_kuliah}</h3>
                          {s.tipe_jadwal === 'PENGGANTI' && (
                            <span className="shrink-0 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md tracking-wider">
                              PENGGANTI
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-500 mb-2.5">
                          {s.nama_kelas && (
                            <span className="text-[13px] font-semibold shrink-0">{s.nama_kelas} -</span>
                          )}
                          <User size={13} className="shrink-0" />
                          <p className="text-[13px] font-semibold truncate">{s.pengajar}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                            <Clock size={13} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{timePart}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors max-w-[200px]">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap truncate">{s.ruangan}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start shrink-0 ml-4">
                      <div className={`px-3 py-2 rounded-xl text-[11px] uppercase font-bold tracking-widest
                        ${status === 'Berjalan' ? 'bg-blue-50 text-blue-500 border border-blue-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
                        {status}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!isLoading && !isSemesterLoading && !error && filtered.length === 0 && (
              <div className="bg-white rounded-[2rem] p-8 md:p-14 border border-dashed border-slate-200 text-center shadow-sm">
                <div className="mx-auto mb-4 w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <BookOpen size={28} />
                </div>
                <p className="text-sm md:text-base font-semibold text-slate-700">Tidak ada jadwal.</p>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  {viewMode === 'PERSONAL' 
                    ? 'Saat ini Anda tidak memiliki sesi kelas yang dijadwalkan pada tanggal ini.' 
                    : 'Tidak ada sesi kelas yang dijadwalkan untuk seluruh asisten pada tanggal ini.'}
                </p>
              </div>
            )}

            <p className="text-[11px] font-medium text-slate-400 px-1 pb-1 mt-4 md:mt-6 text-center md:text-left">
              Menampilkan {filtered.length} jadwal pada {selectedDayLabel}, {selectedDate} {monthLabel}.
            </p>
          </div>
        </div>
      </div>
    </AsdosPageShell>
  );
}
