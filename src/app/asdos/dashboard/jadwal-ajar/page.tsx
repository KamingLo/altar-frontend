'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, Clock, MapPin, BookOpen } from 'lucide-react';

const mockDates = [
  { day: 'SAB', date: '13' }, { day: 'MIN', date: '14' },
  { day: 'SEN', date: '15' }, { day: 'SEL', date: '16' },
  { day: 'RAB', date: '17' }, { day: 'KAM', date: '18' },
  { day: 'JUM', date: '19' },
];
const mockSchedules = [
  { id: 1, session: 'SESI 1', day: 'Sabtu', subject: 'Basis Data', time: '07:30 - 10:00', room: 'Ruang 901', date: '13' },
  { id: 2, session: 'SESI 3', day: 'Sabtu', subject: 'Sistem Operasi', time: '13:30 - 16:00', room: 'Ruang 702', date: '13' },
  { id: 3, session: 'SESI 4', day: 'Sabtu', subject: 'Pemrograman Web', time: '16:30 - 19:00', room: 'Ruang 801', date: '13' },
];

export default function JadwalAjarPage() {
  const [selectedDate, setSelectedDate] = useState('13');
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = mockSchedules.filter(s =>
    s.date === selectedDate &&
    (s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.room.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full max-w-md md:max-w-4xl lg:max-w-6xl mx-auto font-sans text-slate-800 pb-20 md:pb-8 pt-2 md:pt-10 relative md:px-6 overflow-hidden">
      <div className="px-3 md:px-0 animate-fade-up md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-10 lg:p-12">

        <div className="flex justify-between items-center mb-5 mt-2 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold md:font-extrabold text-slate-800">Mei 2024</h1>
          <div className="flex items-center gap-2 md:gap-3">
            {[ChevronLeft, ChevronRight].map((Icon, i) => (
              <button key={i} className="w-8 h-8 md:w-11 md:h-11 flex items-center justify-center bg-white border border-slate-200 rounded-xl md:rounded-2xl text-slate-500 active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:bg-slate-50">
                <Icon className="w-[18px] h-[18px] md:w-6 md:h-6" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 md:gap-4 lg:gap-6 overflow-x-auto pb-4 mb-2 md:mb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x px-1 md:justify-center md:overflow-visible">
          {mockDates.map((item) => {
            const sel = selectedDate === item.date;
            return (
              <div key={item.date} onClick={() => setSelectedDate(item.date)}
                className={`flex flex-col items-center min-w-[70px] md:min-w-[90px] py-4 md:py-5 rounded-3xl md:rounded-[2rem] cursor-pointer transition-all duration-200 snap-center shrink-0 border
                  ${sel ? 'bg-[#941C2F] text-white shadow-lg shadow-[#941C2F]/20 border-[#941C2F] md:-translate-y-1' : 'bg-white text-slate-500 border-slate-100 hover:border-[#941C2F]/30 md:hover:-translate-y-1 md:hover:shadow-md'}`}>
                <span className={`text-[10px] md:text-xs font-bold tracking-widest mb-1 md:mb-2 ${sel ? 'text-white/80' : 'text-slate-400'}`}>{item.day}</span>
                <span className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{item.date}</span>
                <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${sel ? 'bg-white' : 'bg-[#941C2F]/50'}`} />
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mb-8 md:mb-10 md:max-w-2xl md:mx-auto">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 md:left-5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-[18px] h-[18px] md:w-5 md:h-5" />
            </div>
            <input type="text" placeholder="Cari kelas atau ruangan..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm md:text-base rounded-2xl md:rounded-3xl pl-11 md:pl-14 pr-4 py-3.5 md:py-4 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
          </div>
          <button className="bg-white border border-slate-200 p-3.5 md:p-4 rounded-2xl md:rounded-3xl text-slate-500 active:scale-95 transition-all hover:bg-slate-50">
            <Filter className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </button>
        </div>

        <div className="flex justify-between items-center mb-4 md:mb-6 px-1">
          <h4 className="text-[11px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Jadwal Terdaftar</h4>
          <span className="bg-[#941C2F]/10 text-[#941C2F] text-[10px] md:text-xs font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg">{filtered.length} Sesi</span>
        </div>

        <div className="space-y-3 pb-8 pt-2">
          {filtered.length > 0 ? filtered.map(s => (
            <div key={s.id} className="bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between border border-slate-100 active:scale-[0.99] md:hover:shadow-md md:hover:border-slate-200 transition-all gap-3 md:gap-0">
              <div className="flex items-center gap-3 md:gap-4 min-w-0 md:w-2/5">
                <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center bg-rose-50 text-[#941C2F]">
                  <BookOpen size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[15px] md:text-base text-[#1F2937] truncate">{s.subject}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider">{s.session}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-[10px] md:text-xs font-bold text-[#941C2F] tracking-wider uppercase">{s.day}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 pt-3 border-t border-slate-100 md:border-none md:pt-0">
                <div className="flex-1 md:flex-none bg-slate-50 border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center justify-center md:justify-start gap-2">
                  <Clock size={13} className="text-slate-400 shrink-0" />
                  <span className="text-xs md:text-[13px] font-semibold text-slate-700">{s.time}</span>
                </div>
                <div className="flex-1 md:flex-none bg-slate-50 border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center justify-center md:justify-start gap-2">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span className="text-xs md:text-[13px] font-semibold text-slate-700">{s.room}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-2xl p-6 md:p-12 border border-dashed border-slate-200 text-center shadow-sm">
              <div className="mx-auto mb-3 w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><BookOpen size={22} /></div>
              <p className="text-sm md:text-base font-semibold text-slate-700">Tidak ada jadwal terdaftar</p>
              <p className="text-xs md:text-sm text-slate-500 mt-1">Anda tidak memiliki jadwal mengajar di hari ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
