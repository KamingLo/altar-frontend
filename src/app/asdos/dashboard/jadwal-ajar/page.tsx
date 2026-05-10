'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, Clock, MapPin, BookOpen } from 'lucide-react';

const daysInMonth = 31;
const startDayOfWeek = 3;
const dayNamesGrid = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
const dayNamesFull = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

const mockDates = Array.from({ length: daysInMonth }, (_, i) => {
  const date = (i + 1).toString();
  const dayIndex = (startDayOfWeek + i) % 7;
  return { dayMobile: dayNamesFull[dayIndex], dayGrid: dayNamesGrid[dayIndex], date };
});

const mockSchedules = [
  { id: 1, session: 'SESI 1', day: 'Sabtu', subject: 'Jaringan Komputer', time: '13:20 - --:--', room: 'R. M301', date: '13', status: 'Berjalan' },
  { id: 2, session: 'SESI 3', day: 'Sabtu', subject: 'Jaringan Komputer', time: '13:15 - 16:05', room: 'R. M301', date: '13', status: 'Selesai' },
  { id: 3, session: 'SESI 4', day: 'Sabtu', subject: 'Basis Data', time: '13:10 - 15:55', room: 'R. Lab Komp A', date: '13', status: 'Selesai' },
  { id: 4, session: 'SESI 1', day: 'Senin', subject: 'Struktur Data', time: '08:00 - 10:30', room: 'Ruang 402', date: '15', status: 'Selesai' },
];

export default function JadwalAjarPage() {
  const [selectedDate, setSelectedDate] = useState('13');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Berjalan' | 'Selesai'>('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.trim() !== '') {
      const found = mockSchedules.find(s =>
        s.subject.toLowerCase().includes(val.toLowerCase()) ||
        s.room.toLowerCase().includes(val.toLowerCase())
      );
      if (found && found.date !== selectedDate) setSelectedDate(found.date);
    }
  };

  const filtered = mockSchedules.filter(s =>
    s.date === selectedDate &&
    (s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.room.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'ALL' || s.status === filterStatus)
  );

  const hasSchedule = (date: string) => mockSchedules.some(s => s.date === date);

  return (
    <div className="relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 pb-8 pt-2 min-h-screen font-sans">
      <div>

        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
          <div>
            <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Jadwal Mengajar</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Jadwal Ajar</h2>
            <p className="text-sm text-slate-500 mt-1 md:text-base">Daftar jadwal mengajar Anda.</p>
          </div>
          <div className="flex gap-3 relative z-20 w-full md:w-auto md:min-w-[380px]">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-[18px] h-[18px] md:w-5 md:h-5" />
              </div>
              <input
                type="text"
                placeholder="Cari materi atau kelas..."
                value={searchTerm}
                onChange={handleSearch}
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

        {/* Kalender Horizontal - Mobile Only */}
        <div className="md:hidden mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800">Mei 2024</h3>
            <div className="flex items-center gap-2">
              {[ChevronLeft, ChevronRight].map((Icon, i) => (
                <button key={i} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <Icon className="w-[18px] h-[18px]" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
            {mockDates.map((item) => {
              const sel = selectedDate === item.date;
              return (
                <div key={item.date} onClick={() => setSelectedDate(item.date)}
                  className={`flex flex-col items-center min-w-[64px] py-3.5 rounded-2xl cursor-pointer transition-all duration-200 snap-center shrink-0 border
                    ${sel ? 'bg-[#941C2F] text-white shadow-lg shadow-[#941C2F]/20 border-[#941C2F]' : 'bg-white text-slate-500 border-slate-100'}`}>
                  <span className={`text-[10px] font-bold tracking-widest mb-1 ${sel ? 'text-white/80' : 'text-slate-400'}`}>{item.dayMobile}</span>
                  <span className="text-xl font-bold mb-1">{item.date}</span>
                  <div className={`w-1 h-1 rounded-full ${sel ? 'bg-white' : hasSchedule(item.date) ? 'bg-[#941C2F]/50' : 'bg-transparent'}`} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-4 px-1">
            <h4 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Jadwal Terdaftar</h4>
            <span className="bg-[#941C2F]/10 text-[#941C2F] text-[10px] font-bold px-2.5 py-1 rounded-md">{filtered.length} Sesi</span>
          </div>
        </div>

        {/* Body: Kalender Desktop + List */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">

          {/* Kalender Grid - Desktop Only */}
          <div className="hidden md:block w-[300px] lg:w-[320px] bg-white rounded-[2rem] p-6 md:p-7 shadow-sm border border-slate-100 shrink-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Mei 2024</h2>
              <div className="flex items-center gap-2">
                {[ChevronLeft, ChevronRight].map((Icon, i) => (
                  <button key={i} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-4 gap-x-1">
              {dayNamesGrid.map((day, i) => (
                <div key={i} className="text-center text-[11px] font-bold text-[#8BA3CB] mb-2">{day}</div>
              ))}
              {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`sp-${i}`} />)}
              {mockDates.map((item) => {
                const sel = selectedDate === item.date;
                const hasItem = hasSchedule(item.date);
                return (
                  <div key={item.date} onClick={() => setSelectedDate(item.date)}
                    className="flex flex-col items-center justify-center group cursor-pointer">
                    <div className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200
                      ${sel ? 'bg-[#941C2F] text-white shadow-md' : 'bg-transparent text-slate-700 group-hover:bg-slate-100'}`}>
                      <span className="text-sm font-bold">{item.date}</span>
                    </div>
                    <div className={`w-1 h-1 rounded-full mt-1.5 transition-all
                      ${sel && hasItem ? 'bg-[#941C2F]' : !sel && hasItem ? 'bg-[#941C2F]/50' : 'bg-transparent'}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* List Jadwal */}
          <div className="flex-1 w-full space-y-3">
            <div className="hidden md:block mb-1">
              <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Jadwal Terdaftar</h3>
            </div>

            {filtered.length > 0 ? filtered.map(s => (
              <div key={s.id} className="bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm border border-slate-100 md:hover:shadow-md md:hover:border-slate-200 transition-all">

                {/* Mobile */}
                <div className="flex items-center gap-3 md:hidden">
                  <div className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center bg-rose-50 text-[#941C2F]">
                    <BookOpen size={20} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-[#1F2937] truncate">{s.subject}</h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">{s.day}, {s.date} MEI 2024</p>
                  </div>
                  <div className={`shrink-0 self-start mt-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider
                    ${s.status === 'Berjalan' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {s.status}
                  </div>
                </div>
                <div className="flex md:hidden flex-col gap-1.5 mt-3 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{s.time}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{s.room}</span>
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden md:flex md:items-center md:justify-between">
                  <div className="flex items-center gap-4 min-w-0 w-2/5">
                    <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center bg-rose-50 text-[#941C2F]">
                      <BookOpen size={20} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-[#1F2937] truncate">{s.subject}</h3>
                      <p className="text-xs font-bold text-slate-400 tracking-wider mt-0.5">{s.day}, {s.date} MEI 2024</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-lg flex items-center gap-2">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <span className="text-[13px] font-semibold text-slate-700 whitespace-nowrap">{s.time}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-lg flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="text-[13px] font-semibold text-slate-700 whitespace-nowrap">{s.room}</span>
                    </div>
                    <div className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold tracking-wider
                      ${s.status === 'Berjalan' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {s.status}
                    </div>
                  </div>
                </div>

              </div>
            )) : (
              <div className="bg-white rounded-2xl p-6 md:p-12 border border-dashed border-slate-200 text-center shadow-sm">
                <div className="mx-auto mb-3 w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <BookOpen size={22} />
                </div>
                <p className="text-sm md:text-base font-semibold text-slate-700">Tidak ada jadwal.</p>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Belum ada jadwal untuk tanggal ini.</p>
              </div>
            )}

            <p className="text-[11px] font-medium text-slate-400 px-1 pb-1 md:mt-2">
              Menampilkan {filtered.length} jadwal pada {selectedDate} Mei.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
