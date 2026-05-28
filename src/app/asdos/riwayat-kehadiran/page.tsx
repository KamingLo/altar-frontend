'use client';
import React, { useEffect, useState } from 'react';
import { Search, Filter, Clock, MapPin, BookOpen, Info } from 'lucide-react';
import { getMyPresensi, type PresensiResponseDTO } from '@/lib/actions/presensi';
import { AsdosPageHeader, AsdosPageShell, AsdosState } from '@/components/dashboard/asdos/AsdosUI';
import { useRiwayatKehadiranStore } from '@/store/useRiwayatKehadiranStore';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { BottomSheet } from '@/components/ui/BottomSheet';

type HistoryItem = {
  id: string; subject: string; date: string;
  checkIn: string; checkOut: string; room: string;
  status: 'BERJALAN' | 'SELESAI'; materi: string;
  isVerified: boolean; isPaid: boolean;
};

function isActivePresensi(item: PresensiResponseDTO) {
  const checkout = item.waktu_checkout;
  const hasNoCheckout = !checkout || checkout === '' || checkout === 'null' || String(checkout).startsWith('0001');
  if (!hasNoCheckout) return false;

  const sessionDate = new Date(item.tanggal_mengajar);
  const today = new Date();
  const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return sessionDay >= todayDay;
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
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
    materi: item.deskripsi_materi || (active ? 'Sesi sedang berlangsung. Materi belum diisi.' : '-'),
    isVerified: item.is_verified,
    isPaid: item.is_paid,
  };
}

export default function RiwayatKehadiranPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'BERJALAN' | 'SELESAI'>('ALL');
  const {
    items,
    fetched,
    visibleCount,
    isLoading,
    error,
    setItems,
    setLoading,
    setError,
    showMore,
    resetVisible,
  } = useRiwayatKehadiranStore();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (fetched) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const res = await getMyPresensi();
      if (res.success) {
        setItems(res.data ?? []);
      } else {
        setError(res.message || 'Gagal memuat riwayat kehadiran.');
      }
      setLoading(false);
    }
    fetchHistory();
  }, [fetched, setError, setItems, setLoading]);

  useEffect(() => {
    resetVisible();
  }, [searchTerm, filterStatus, resetVisible]);

  const history = items.map(mapPresensiToHistory);
  const filtered = history.filter(item =>
    (item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.room.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'ALL' || item.status === filterStatus)
  );
  const displayed = filtered.slice(0, visibleCount);
  const hasMore = displayed.length < filtered.length;

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
                className="w-full bg-white border border-slate-200 text-sm md:text-base rounded-2xl md:rounded-3xl pl-11 md:pl-14 pr-4 py-3.5 md:py-4 focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
            </div>
            <CustomSelect
              value={filterStatus}
              onChange={(val) => setFilterStatus(val as 'ALL' | 'BERJALAN' | 'SELESAI')}
              options={[
                { value: 'ALL', label: 'Semua Status' },
                { value: 'BERJALAN', label: 'Sedang Berjalan' },
                { value: 'SELESAI', label: 'Selesai' },
              ]}
              variant="icon"
              icon={<Filter className="w-[18px] h-[18px] md:w-5 md:h-5" />}
              align="right"
              triggerClassName={filterStatus !== 'ALL' ? 'bg-red-50 border-crimson text-crimson' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}
            />
          </div>
        }
      />

      <div className="flex flex-col gap-6 w-full pb-8">
        {isLoading ? (
          <div className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6 w-full animate-pulse">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex flex-col gap-3 w-full md:w-1/3">
                <div className="h-6 md:h-8 w-3/4 rounded-lg bg-slate-100" />
                <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
              </div>

              <div className="flex flex-row gap-6 md:gap-8 w-full md:w-auto">
                <div className="border-l-2 border-slate-100 pl-4 space-y-2">
                  <div className="h-3 w-14 rounded bg-slate-100" />
                  <div className="h-4 w-24 rounded bg-slate-100" />
                </div>
                <div className="border-l-2 border-slate-100 pl-4 space-y-2">
                  <div className="h-3 w-12 rounded bg-slate-100" />
                  <div className="h-4 w-28 rounded bg-slate-100" />
                </div>
              </div>

              <div className="h-9 w-24 rounded-xl bg-slate-100 mt-2 md:mt-0" />
            </div>

            <div className="bg-fog rounded-[12px] md:rounded-[20px] p-5 space-y-3">
              <div className="h-4 w-40 rounded bg-slate-200/70" />
              <div className="h-4 w-full rounded bg-slate-200/70" />
              <div className="h-4 w-2/3 rounded bg-slate-200/70" />
            </div>
            <p className="sr-only">Memuat riwayat kehadiran...</p>
          </div>
        ) : error ? (
          <AsdosState variant="error" message={error} />
        ) : displayed.length > 0 ? displayed.map(item => {
          return (
            <section
              key={item.id}
              className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6 w-full"
            >
              <article className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

                <div className="flex flex-col gap-1 w-full md:w-1/3">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 leading-snug">{item.subject}</h2>
                  <p className="text-sm text-slate-500 font-medium">Ruang: {item.room}</p>
                </div>

                <div className="flex flex-row gap-6 md:gap-8 w-full md:w-auto">
                  <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
                    <span className="text-sm md:text-base font-bold text-slate-800">{item.date}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                    <span className="text-sm md:text-base font-bold text-slate-800">{item.checkIn} – {item.checkOut}</span>
                  </div>
                </div>

              </article>

              <div className="flex flex-wrap gap-2 -mt-2">
                <span className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest ${item.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {item.isVerified ? 'Sudah Diverifikasi' : 'Belum Diverifikasi'}
                </span>
                <span className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest ${item.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {item.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                </span>
              </div>

              <div className="bg-fog rounded-[20px] p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-800">
                  <Info className="w-[18px] h-[18px] text-slate-800" strokeWidth={2.5} />
                  <span className="text-sm md:text-base font-bold text-slate-800">Bahasan Materi</span>
                </div>
                <p className="text-sm text-slate-500 mt-1 ml-1 leading-relaxed">
                  &quot;{item.materi}&quot;
                </p>
                {item.checkOut === '--:--' && item.status === 'SELESAI' && (
                  <p className="text-xs font-semibold text-crimson mt-2 ml-1">
                    Kamu tidak melakukan checkout pada sesi ini.
                  </p>
                )}
              </div>

            </section>
          );
        }) : (
          <div className="bg-white border border-slate-100 rounded-[12px] md:rounded-[32px] p-6 md:p-8 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-[14px] bg-fog flex items-center justify-center text-slate-500">
              <Clock size={20} />
            </div>
            <p className="text-base md:text-lg text-slate-800 font-bold">Belum ada riwayat kehadiran.</p>
            <p className="text-sm text-slate-400 mt-1">Riwayat akan muncul setelah Anda melakukan check-in.</p>
          </div>
        )}

        <p className="text-xs font-medium text-slate-400 text-center mt-2">
          Menampilkan {displayed.length} dari {filtered.length} riwayat kehadiran.
        </p>

        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              onClick={showMore}
              className="px-6 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-crimson/30 hover:text-crimson shadow-sm transition-all active:scale-95"
            >
              Tampilkan Lebih Banyak
            </button>
          </div>
        )}
      </div>

      <BottomSheet
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.subject}
        subtitle={selectedItem?.date}
      >
        {selectedItem && (
          <div className="pt-2">
            <div className="flex bg-white rounded-2xl border border-slate-100 p-4 md:p-6 mb-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] divide-x divide-slate-100">
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

            <div className="flex flex-wrap gap-2 mb-5">
              <span className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest ${selectedItem.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {selectedItem.isVerified ? 'Sudah Diverifikasi' : 'Belum Diverifikasi'}
              </span>
              <span className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest ${selectedItem.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {selectedItem.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2 ml-1">
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                <h4 className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Lokasi / Ruangan</h4>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {selectedItem.room}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-2 ml-1">
                <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                <h4 className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Bahasan Materi Lengkap</h4>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 text-sm md:text-base text-slate-600 shadow-[0_2px_10px_rgba(0,0,0,0.02)] leading-relaxed min-h-[80px]">
                {selectedItem.materi}
              </div>
              {selectedItem.checkOut === '--:--' && selectedItem.status === 'SELESAI' && (
                <p className="text-xs font-semibold text-red-500 mt-2 ml-1">Kamu tidak melakukan checkout pada sesi ini.</p>
              )}
            </div>

            <button onClick={() => setSelectedItem(null)}
              className="w-full md:hidden bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-[0.98] hover:bg-slate-200 transition-all text-[15px]">
              Tutup
            </button>
          </div>
        )}
      </BottomSheet>
    </AsdosPageShell>
  );
}
