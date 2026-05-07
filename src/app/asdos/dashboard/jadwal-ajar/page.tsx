'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, Clock, MapPin, BookOpen } from 'lucide-react';


const mockDates = [
  { day: 'SAB', date: '13' },
  { day: 'MIN', date: '14' },
  { day: 'SEN', date: '15' },
  { day: 'SEL', date: '16' },
  { day: 'RAB', date: '17' },
  { day: 'KAM', date: '18' },
  { day: 'JUM', date: '19' },
];


const mockSchedules = [
  {
    id: 1,
    session: 'SESI 1',
    day: 'Sabtu',
    subject: 'Basis Data',
    time: '07:30 - 10:00',
    room: 'Ruang 901',
    date: '13',
  },
  {
    id: 2,
    session: 'SESI 3',
    day: 'Sabtu',
    subject: 'Sistem Operasi',
    time: '13:30 - 16:00',
    room: 'Ruang 702',
    date: '13',
  },
];

export default function JadwalAjarPage() {
  const [selectedDate, setSelectedDate] = useState('13');
  const [searchTerm, setSearchTerm] = useState('');
  const filteredSchedules = mockSchedules.filter((schedule) => {
    const matchDate = schedule.date === selectedDate;
    const matchSearch = 
      schedule.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
      schedule.room.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDate && matchSearch;
  });

  return (
    <div className="w-full max-w-md mx-auto font-sans text-slate-800 pb-20 pt-2 relative">
      
      <div className="px-3 animate-fade-up">
        <div className="flex justify-between items-center mb-5 mt-2">
          <h1 className="text-xl font-bold text-slate-800">Mei 2024</h1>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:bg-slate-50">
              <ChevronLeft size={18} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:bg-slate-50">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x px-1">
          {mockDates.map((item) => {
            const isSelected = selectedDate === item.date;
            return (
              <div
                key={item.date}
                onClick={() => setSelectedDate(item.date)}
                className={`flex flex-col items-center min-w-[70px] py-4 rounded-3xl cursor-pointer transition-all duration-200 snap-center shrink-0 border
                  ${isSelected 
                    ? 'bg-[#941C2F] text-white shadow-lg shadow-[#941C2F]/20 border-[#941C2F]' 
                    : 'bg-white text-slate-500 border-slate-100 hover:border-[#941C2F]/30'
                  }`}
              >
                <span className={`text-[10px] font-bold tracking-widest mb-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  {item.day}
                </span>
                <span className="text-xl font-bold mb-1">{item.date}</span>
                <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#941C2F]/50'}`}></div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari kelas atau ruangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            />
          </div>
          <button className="bg-white border border-slate-200 p-3.5 rounded-2xl text-slate-500 active:scale-95 transition-all hover:bg-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <Filter size={18} />
          </button>
        </div>

        <div className="flex justify-between items-center mb-4 px-1">
          <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            Jadwal Terdaftar
          </h4>
          <span className="bg-[#941C2F]/10 text-[#941C2F] text-[10px] font-bold px-2.5 py-1 rounded-md">
            {filteredSchedules.length} Sesi
          </span>
        </div>

        <div className="space-y-4">
          {filteredSchedules.length > 0 ? (
            filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 cursor-pointer active:scale-[0.98] transition-all hover:border-[#941C2F]/20"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider">
                      {schedule.session}
                    </span>
                    <span className="text-[10px] font-bold text-[#941C2F] tracking-wider">
                      {schedule.day}
                    </span>
                  </div>
                  <div className="bg-[#941C2F]/5 text-[#941C2F] p-2 rounded-xl">
                    <BookOpen size={16} strokeWidth={2.5} />
                  </div>
                </div>
                
                <h3 className="text-[17px] font-bold text-slate-800 mb-5">{schedule.subject}</h3>
                
                <div className="flex items-center gap-5 text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-[11px] font-medium">{schedule.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-[11px] font-medium">{schedule.room}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-sm text-slate-500 font-medium">Tidak ada jadwal.</p>
              <p className="text-xs text-slate-400 mt-1">Anda tidak memiliki jadwal mengajar di hari ini.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}