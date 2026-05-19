'use client';
import React, { useEffect, useState } from 'react';
import { Search, Filter, Clock, MapPin, BookOpen, X } from 'lucide-react';
import { getMyPresensi, type PresensiResponseDTO } from '@/lib/actions/presensi';
import { AsdosLoadingState, AsdosPageHeader, AsdosPageShell, AsdosState } from '@/components/dashboard/asdos/AsdosUI';

type HistoryItem = {
  id: string; subject: string; date: string;
  checkIn: string; checkOut: string; room: string;
  status: 'BERJALAN' | 'SELESAI'; materi: string;
};

const statusCfg = {
  BERJALAN: { bg: 'bg-blue-50',    text: 'text-blue-500',    label: 'Berjalan' },
  SELESAI:  { bg: 'bg-emerald-50', text: 'text-emerald-500', label: 'Selesai'  },
};

function isActivePresensi(item: PresensiResponseDTO) {
  const checkout = item.waktu_checkout;
  return !checkout || checkout === '' || checkout === 'null' || String(checkout).startsWith('0001');
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
}

function formatTime(value?: string) {
  if (!value || value === 'null' || String(value).startsWith('0001')) return '--:--';
  return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function mapPresensiToHistory(item: PresensiResponseDTO): HistoryItem {
  const active = isActivePresensi(item);
  return {
    id: item.id_presensi,
    subject: item.nama_mata_kuliah,
    date: formatDate(item.tanggal_mengajar || item.waktu_checkin),
    checkIn: formatTime(item.waktu_checkin),
    checkOut: active ? '--:--' : formatTime(item.waktu_checkout),
    room: item.nama_ruangan,
    status: active ? 'BERJALAN' : 'SELESAI',
    materi: item.deskripsi_materi || (active ? 'Sesi sedang berlangsung. Materi belum diisi.' : 'Materi tidak tersedia.'),
  };
}

export default function RiwayatKehadiranPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'BERJALAN' | 'SELESAI'>('ALL');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [sheetStartY, setSheetStartY] = useState(0);
  const [sheetDragY, setSheetDragY] = useState(0);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setFetchError(null);
      const res = await getMyPresensi();

      if (res.success && res.data) {
        setHistory(res.data.map(mapPresensiToHistory));
      } else {
        setFetchError(res.message || 'Gagal memuat riwayat kehadiran.');
      }

      setIsLoading(false);
    }

    fetchHistory();
  }, []);

  const filtered = history.filter(item =>
    (item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.room.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'ALL' || item.status === filterStatus)
  );

  const handleOpenSheet = (item: HistoryItem) => {
    setSelectedItem(item);
    setIsSheetClosing(false);
    setSheetDragY(0);
    setTimeout(() => setIsSheetVisible(true), 10);
  };

  const handleCloseSheet = () => {
    setIsSheetClosing(true);
    setIsSheetVisible(false);
    setTimeout(() => {
      setSelectedItem(null);
      setIsSheetClosing(false);
      setSheetDragY(0);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => setSheetStartY(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - sheetStartY;
    if (delta > 0) setSheetDragY(delta);
  };
  const handleTouchEnd = () => {
    if (sheetDragY > 100) handleCloseSheet();
    else setSheetDragY(0);
  };

  return (
    <AsdosPageShell>

      <AsdosPageHeader
        eyebrow="Rekap Mengajar"
        title="Riwayat Kehadiran"
        description="Log aktivitas mengajar Anda."
        action={
        <div className="flex gap-3 relative z-20 w-full md:w-auto md:min-w-[380px]">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-[18px] h-[18px] md:w-5 md:h-5" />
            </div>
            <input type="text" placeholder="Cari materi atau kelas..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm md:text-base rounded-2xl md:rounded-3xl pl-11 md:pl-14 pr-4 py-3.5 md:py-4 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
          </div>
          <div className="relative shrink-0">
            <button onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`border p-3.5 md:p-4 rounded-2xl md:rounded-3xl active:scale-95 transition-all flex items-center justify-center
                ${filterStatus !== 'ALL' ? 'bg-red-50 border-[#941C2F] text-[#941C2F]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <Filter className="w-[18px] h-[18px] md:w-5 md:h-5" />
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 top-[110%] w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-2 overflow-hidden">
                  {(['ALL', 'BERJALAN', 'SELESAI'] as const).map(s => (
                    <button key={s} onClick={() => { setFilterStatus(s); setShowFilterMenu(false); }}
                      className={`w-full text-left px-5 py-3 text-sm transition-colors ${filterStatus === s ? 'bg-slate-50 text-[#941C2F] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {s === 'ALL' ? 'Semua Status' : s === 'BERJALAN' ? 'Sedang Berjalan' : 'Selesai'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        }
      />

      <div className="space-y-3 pb-8">
        {isLoading ? (
          <AsdosLoadingState message="Memuat riwayat kehadiran..." />
        ) : fetchError ? (
          <AsdosState variant="error" message={fetchError} />
        ) : filtered.length > 0 ? filtered.map(item => {
          const cfg = statusCfg[item.status];
          return (
            <div key={item.id} onClick={() => handleOpenSheet(item)}
              className="bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm border border-slate-100 cursor-pointer active:scale-[0.99] md:hover:shadow-md md:hover:border-slate-200 transition-all">

              <div className="flex items-center gap-3 md:hidden">
                <div className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center bg-rose-50 text-[#941C2F]">
                  <BookOpen size={20} strokeWidth={2} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[15px] text-[#1F2937] truncate">{item.subject}</h3>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">{item.date}</p>
                </div>

                <div className={`shrink-0 self-start mt-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </div>
              </div>

              <div className="flex md:hidden flex-col gap-1.5 mt-3 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Clock size={13} className="text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">{item.checkIn} - {item.checkOut}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">{item.room}</span>
                </div>
              </div>

              <div className="hidden md:flex md:items-center md:justify-between">
                <div className="flex items-center gap-4 min-w-0 w-2/5">
                  <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center bg-rose-50 text-[#941C2F]">
                    <BookOpen size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-[#1F2937] truncate">{item.subject}</h3>
                    <p className="text-xs font-bold text-slate-400 tracking-wider mt-0.5">{item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-lg flex items-center justify-start gap-2">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="text-[13px] font-semibold text-slate-700">{item.checkIn} - {item.checkOut}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-lg flex items-center justify-start gap-2">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="text-[13px] font-semibold text-slate-700">{item.room}</span>
                  </div>
                  <div className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold tracking-wider ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </div>
                </div>
              </div>

            </div>
          );
        }) : (
          <AsdosState icon={<BookOpen size={22} />} title="Riwayat tidak ditemukan." message="Coba gunakan kata kunci atau filter lain." />
        )}
        <p className="text-[11px] font-medium text-slate-400 px-1 pb-1 md:mt-2">
          Menampilkan {filtered.length} riwayat kehadiran.
        </p>
      </div>

      {selectedItem && (
        <>
          <div
            onClick={handleCloseSheet}
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out
              ${isSheetVisible && !isSheetClosing ? 'opacity-100' : 'opacity-0'}`}
          />

          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
            <div
              className="w-full max-w-md md:max-w-xl bg-white rounded-t-[28px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col max-h-[calc(100dvh-6rem)] md:max-h-[85vh] overflow-hidden pointer-events-auto"
              style={{
                transform: (!isSheetVisible || isSheetClosing)
                  ? 'translateY(100%)'
                  : `translateY(${sheetDragY}px)`,
                transition: (!isSheetVisible || isSheetClosing || sheetDragY === 0)
                  ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                  : 'none',
              }}
            >
              <div
                className="w-full flex md:hidden items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              <div className="px-5 pt-2 md:pt-6 pb-6 overflow-y-auto">
                <div className="flex items-start justify-between mb-1 md:mb-2">
                  <div className="pr-10">
                    <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">{selectedItem.subject}</h2>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">{selectedItem.date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg tracking-wider ${statusCfg[selectedItem.status].bg} ${statusCfg[selectedItem.status].text}`}>
                      {statusCfg[selectedItem.status].label}
                    </span>
                    <button onClick={handleCloseSheet}
                      className="hidden md:flex w-9 h-9 items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex bg-white rounded-2xl border border-slate-100 p-4 md:p-6 mt-5 mb-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] divide-x divide-slate-100">
                  {[{ label: 'Check-In', time: selectedItem.checkIn }, { label: 'Check-Out', time: selectedItem.checkOut }].map(({ label, time }) => (
                    <div key={label} className="flex-1 flex flex-col items-center justify-center">
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">{label}</p>
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Clock className="w-[14px] h-[14px] text-slate-400" />
                        <span className="text-base md:text-xl font-bold">{time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2 ml-1">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                    <h4 className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Lokasi / Ruangan</h4>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm font-semibold text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {selectedItem.room}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-2 ml-1">
                    <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                    <h4 className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Bahasan Materi</h4>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 text-sm md:text-base text-slate-600 shadow-[0_2px_10px_rgba(0,0,0,0.02)] leading-relaxed min-h-[80px]">
                    {selectedItem.materi}
                  </div>
                </div>

                <button onClick={handleCloseSheet}
                  className="w-full md:hidden bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-[0.98] hover:bg-slate-200 transition-all text-[15px]">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AsdosPageShell>
  );
}
