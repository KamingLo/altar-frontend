'use client';
import React, { useState } from 'react';
import { Search, Filter, Clock, MapPin, BookOpen } from 'lucide-react';

type HistoryItem = {
  id: string;
  subject: string;
  date: string;
  checkIn: string;
  checkOut: string;
  room: string;
  status: 'BERJALAN' | 'SELESAI';
  materi: string;
};

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    subject: 'Jaringan Komputer - Sesi 3',
    date: 'SENIN, 13 MEI 2024',
    checkIn: '13:20',
    checkOut: '--:--',
    room: 'R. M301',
    status: 'BERJALAN',
    materi: 'Sesi sedang berlangsung. Materi belum diisi.',
  },
  {
    id: '2',
    subject: 'Jaringan Komputer - Sesi 3',
    date: 'KAMIS, 09 MEI 2024',
    checkIn: '13:15',
    checkOut: '16:05',
    room: 'R. M301',
    status: 'SELESAI',
    materi: '"Subnetting & Routing Basic: Implementasi pada Packet Tracer."',
  },
  {
    id: '3',
    subject: 'Jaringan Komputer - Sesi 3',
    date: 'SENIN, 06 MEI 2024',
    checkIn: '13:30',
    checkOut: '16:10',
    room: 'R. M301',
    status: 'SELESAI',
    materi: 'Pengenalan Topologi Jaringan dan Konfigurasi Dasar Switch.',
  },
  {
    id: '4',
    subject: 'Basis Data - Sesi 2',
    date: 'KAMIS, 02 MEI 2024',
    checkIn: '13:10',
    checkOut: '15:55',
    room: 'R. Lab Komp A',
    status: 'SELESAI',
    materi: 'Normalisasi Database (1NF, 2NF, 3NF) dan Studi Kasus.',
  },
];

export default function RiwayatKehadiranPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'BERJALAN' | 'SELESAI'>('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filteredHistory = mockHistory.filter((item) => {
    const matchSearch = item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.room.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ALL' ? true : item.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full max-w-md mx-auto font-sans text-slate-800 pb-20 pt-2 relative">
      
      <div className="px-1 animate-fade-up">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Riwayat Kehadiran</h1>
          <p className="text-sm text-slate-500">Log aktivitas mengajar Anda</p>
        </div>

        <div className="flex gap-3 mb-6 relative z-20">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari materi atau kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`border p-3.5 rounded-2xl active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-center
                ${filterStatus !== 'ALL' 
                  ? 'bg-red-50 border-[#941C2F] text-[#941C2F]' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
            >
              <Filter size={18} />
            </button>

            {showFilterMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowFilterMenu(false)}
                ></div>
                
                <div className="absolute right-0 top-[110%] w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-2 overflow-hidden animate-fade-up" style={{ animationDuration: '0.2s' }}>
                  <button
                    onClick={() => { setFilterStatus('ALL'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${filterStatus === 'ALL' ? 'bg-slate-50 text-[#941C2F] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Semua Status
                  </button>
                  <button
                    onClick={() => { setFilterStatus('BERJALAN'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${filterStatus === 'BERJALAN' ? 'bg-slate-50 text-[#941C2F] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Sedang Berjalan
                  </button>
                  <button
                    onClick={() => { setFilterStatus('SELESAI'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${filterStatus === 'SELESAI' ? 'bg-slate-50 text-[#941C2F] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Selesai
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 cursor-pointer active:scale-[0.98] transition-all hover:border-[#941C2F]/30"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest">{item.date}</p>
                  <span
                    className={`text-[9px] font-bold px-2 py-1 rounded-md tracking-wider ${
                      item.status === 'BERJALAN'
                        ? 'bg-blue-50 text-blue-500'
                        : 'bg-emerald-50 text-emerald-500'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                
                <h3 className="text-[15px] font-bold text-slate-800 mb-4">{item.subject}</h3>
                
                <div className="flex items-center gap-5 text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span className="text-[11px] font-medium">{item.checkIn} - {item.checkOut}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    <span className="text-[11px] font-medium">{item.room}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-3xl border border-slate-100">
              <p className="text-sm text-slate-500 font-medium">Riwayat tidak ditemukan.</p>
              <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci atau filter lain.</p>
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/20 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-0" onClick={() => setSelectedItem(null)}></div>
          
          <div 
            className="bg-white w-full max-w-md rounded-t-[2rem] p-6 pb-8 animate-fade-up border-t border-slate-100 relative z-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>

            <div className="flex justify-between items-start mb-1">
              <h2 className="text-lg font-bold text-slate-800 pr-4">{selectedItem.subject}</h2>
              <span
                className={`text-[9px] font-bold px-2 py-1 rounded-md tracking-wider shrink-0 mt-1 ${
                  selectedItem.status === 'BERJALAN'
                    ? 'bg-blue-50 text-blue-500'
                    : 'bg-emerald-50 text-emerald-500'
                }`}
              >
                {selectedItem.status}
              </span>
            </div>
            
            <p className="text-xs font-medium text-slate-500 mb-6">{selectedItem.date.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</p>

            <div className="flex bg-white rounded-2xl border border-slate-100 p-4 mb-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] divide-x divide-slate-100">
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-2">Check-In</p>
                <div className="flex items-center gap-1.5 text-slate-800">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-base font-bold">{selectedItem.checkIn}</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-2">Check-Out</p>
                <div className="flex items-center gap-1.5 text-slate-800">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-base font-bold">{selectedItem.checkOut}</span>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2 ml-1">
                <MapPin size={12} className="text-slate-400" />
                <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Lokasi / Ruangan</h4>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm font-semibold text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {selectedItem.room.replace('R.', 'Ruang')}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-1.5 mb-2 ml-1">
                <BookOpen size={12} className="text-slate-400" />
                <h4 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Bahasan Materi</h4>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-600 shadow-[0_2px_10px_rgba(0,0,0,0.02)] leading-relaxed">
                {selectedItem.materi}
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full bg-white text-slate-600 font-semibold py-3.5 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] hover:bg-slate-50 transition-all"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      )}

    </div>
  );
}