'use client';
import { useEffect, useMemo, useState } from 'react';
import { Check, ArrowLeft, BookOpen, Send, Loader2, AlertCircle } from 'lucide-react';
import { submitOnlineAttendance } from '@/lib/actions/presensi';
import { getSessionsByDate, type SessionFromAPI } from '@/lib/actions/jadwal';

import { AsdosOnlineSessionSkeleton, AsdosPageHeader, AsdosPageShell } from '@/components/dashboard/asdos/AsdosUI';

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function getSessionTime(session?: SessionFromAPI) {
  const raw = session?.waktu.split(', ').pop() ?? '';
  const [start = '', end = ''] = raw.split(' - ').map(part => part.trim());
  return { start, end, label: raw || '-' };
}

function isSessionPast(session: SessionFromAPI): boolean {
  const [datePart, timePart] = session.waktu.split(', ');
  if (!datePart || !timePart) return false;
  const endTime = timePart.split(' - ')[1]?.trim();
  if (!endTime) return false;
  const [endH, endM] = endTime.split(':').map(Number);
  if (isNaN(endH) || isNaN(endM)) return false;
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return false;
  const sessionEnd = new Date(year, month - 1, day, endH, endM, 0);
  return sessionEnd < new Date();
}



export default function PresensiKelasOnlinePage() {
  const [step, setStep] = useState(1);
  const [sessions, setSessions] = useState<SessionFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [waktuMulai, setWaktuMulai] = useState('');
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [materi, setMateri] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const MAX_MATERI = 100;
  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const onlineSessions = useMemo(() => sessions.filter(s => !isSessionPast(s)), [sessions]);
  const selectedSession = onlineSessions.find(s => s.id_sesi === selectedSessionId);
  const selectedTime = getSessionTime(selectedSession);

  useEffect(() => {
    async function fetchSessions() {
      setIsLoading(true);
      const res = await getSessionsByDate(todayIso());
      if (res.success && res.data) {
        setSessions(res.data);
        const firstSession = res.data.find(s => !isSessionPast(s));
        if (firstSession) {
          const firstTime = getSessionTime(firstSession);
          setSelectedSessionId(firstSession.id_sesi);
          setWaktuMulai(firstTime.start);
          setWaktuSelesai(firstTime.end);
        }
      }
      setIsLoading(false);
    }
    fetchSessions();
  }, []);

  const handleReset = () => {
    const firstSession = onlineSessions[0];
    const firstTime = getSessionTime(firstSession);
    setStep(1);
    setSelectedSessionId(firstSession?.id_sesi ?? null);
    setLink('');
    setWaktuMulai(firstTime.start);
    setWaktuSelesai(firstTime.end);
    setMateri('');
    setIsConfirmOpen(false);
  };

  const handleSelectSession = (session: SessionFromAPI) => {
    const time = getSessionTime(session);
    setSelectedSessionId(session.id_sesi);
    setWaktuMulai(time.start);
    setWaktuSelesai(time.end);
  };


  const handleConfirmSend = async () => {
    if (!selectedSession) return;

    setIsSubmitting(true);
    const res = await submitOnlineAttendance({
      id_sesi: selectedSession.id_sesi,
      waktu_mulai: waktuMulai,
      waktu_selesai: waktuSelesai,
      deskripsi_materi: materi,
      link_video: link,
      menggantikan: selectedSession.tipe_jadwal === 'PENGGANTI',
      id_sesi_pengganti: selectedSession.tipe_jadwal === 'PENGGANTI' ? selectedSession.id_sesi : undefined,
    });

    if (res.success) {
      setStep(3);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <AsdosPageShell>
        <AsdosOnlineSessionSkeleton count={3} />
      </AsdosPageShell>
    );
  }

  if (onlineSessions.length === 0 && step !== 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tidak Ada Jadwal Hari Ini</h2>
        <p className="text-slate-500 mb-8 max-w-xs">
          Tambahkan jadwal mengajar hari ini terlebih dahulu agar presensi online bisa dilakukan.
        </p>
      </div>
    );
  }

  return (
    <AsdosPageShell>


      {step === 1 && (
        <>
          <AsdosPageHeader eyebrow="Presensi Kelas Online" title="Pilih Sesi Mengajar" description="Pilih jadwal hari ini, lalu isi link, jam mengajar, dan materi." />
          <div>
            <div className="flex justify-between items-center mb-4 md:mb-6 px-1">
              <h4 className="text-[11px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Sesi Tersedia Hari Ini</h4>
              <span className="bg-crimson/10 text-crimson text-[10px] md:text-xs font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg">{onlineSessions.length} Sesi</span>
            </div>
            <div className="space-y-4 mb-6 md:mb-8">
              {onlineSessions.map(s => {
                const isSel = selectedSessionId === s.id_sesi;
                const time = getSessionTime(s);
                return (
                  <div key={s.id_sesi} onClick={() => handleSelectSession(s)}
                    className={`bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 border flex flex-col gap-6 w-full cursor-pointer active:scale-[0.99] transition-all
                      ${isSel ? 'border-crimson shadow-md shadow-crimson/10' : 'border-slate-100 hover:border-slate-200 hover:shadow-md shadow-[0_4px_24px_rgba(0,0,0,0.04)]'}`}>
                    <article className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-start justify-between gap-4 md:block md:w-1/3 w-full">
                        <div className="flex flex-col gap-1 min-w-0">
                          <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug mb-1">{s.mata_kuliah}</h3>
                          <p className="text-sm text-slate-500 font-medium">{s.nama_kelas}</p>
                          {s.tipe_jadwal === 'PENGGANTI' && (
                            <span className="w-fit mt-2 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-fog text-ink uppercase">Pengganti</span>
                          )}
                        </div>
                        <div className={`md:hidden shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSel ? 'bg-crimson shadow-md' : 'bg-slate-100'}`}>
                          <Check size={14} strokeWidth={3} className={isSel ? 'text-white' : 'text-slate-300'} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-full md:w-[480px]">
                        <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                          <span className="text-sm md:text-base font-bold text-slate-800">{time.label}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
                          <span className="text-sm md:text-base font-bold text-slate-800">
                            {new Date(s.waktu.split(', ')[0]).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengajar</span>
                          <span className="text-sm md:text-base font-bold text-slate-800">{s.pengajar || '-'}</span>
                        </div>
                      </div>
                      <div className={`hidden md:flex shrink-0 w-8 h-8 rounded-full items-center justify-center transition-all ${isSel ? 'bg-crimson shadow-md' : 'bg-slate-100'}`}>
                        <Check size={14} strokeWidth={3} className={isSel ? 'text-white' : 'text-slate-300'} />
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>


            <div className={`hidden md:flex md:justify-end transition-all duration-300 ${selectedSessionId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
              <button onClick={() => setStep(2)} disabled={!selectedSessionId}
                className="bg-crimson text-white font-bold py-3 px-10 text-[15px] rounded-2xl shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-50">
                Lanjut Isi Laporan
              </button>
            </div>
          </div>

          <div className="h-24 md:hidden" />
          <div className={`md:hidden fixed bottom-0 left-0 right-0 px-4 pb-6 z-30 transition-all duration-300 ${selectedSessionId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button onClick={() => setStep(2)} disabled={!selectedSessionId}
              className="w-full bg-crimson text-white font-bold py-4 text-[15px] rounded-2xl shadow-xl shadow-crimson/30 active:scale-[0.98] transition-all disabled:opacity-50">
              Lanjut Isi Laporan
            </button>
          </div>
        </>
      )}

      {step === 2 && selectedSession && (
        <>
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase md:text-xs">Presensi Kelas Online</p>
              <h2 className="text-[22px] md:text-3xl leading-7 md:leading-8 font-extrabold text-[#1F2937]">Isi Laporan</h2>
            </div>
            <button onClick={() => setStep(1)}
              className="shrink-0 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-2xl active:scale-95 transition-all hover:bg-slate-50 shadow-sm">
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <section className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-5 w-full">
              <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="Masukkan link Teams / rekaman..."
                className="w-full bg-fog rounded-[14px] p-4 md:p-5 text-sm md:text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crimson/30 transition-all border-0" />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-[18px] h-[18px] text-slate-800" strokeWidth={2.5} />
                  <span className="text-sm md:text-base font-bold text-slate-800">Bahasan Materi</span>
                </div>
                <div className="relative">
                  <textarea value={materi} onChange={e => { if (e.target.value.length <= MAX_MATERI) setMateri(e.target.value); }}
                    placeholder="Ketik detail bahasan materi hari ini..."
                    className="w-full bg-fog rounded-[14px] p-4 md:p-5 pb-8 text-sm md:text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crimson/30 transition-all resize-none h-36 md:h-48 border-0" />
                  <div className={`absolute bottom-3 right-4 text-[10px] font-medium bg-fog/80 px-1 ${materi.length >= MAX_MATERI ? 'text-crimson' : 'text-slate-400'}`}>
                    {materi.length} / {MAX_MATERI} huruf
                  </div>
                </div>
              </div>

              <p className="text-[10px] md:text-xs text-crimson font-medium leading-relaxed">
                * Mohon isi tautan dan materi dengan jelas sebagai bukti presensi kehadiran asisten dosen.
              </p>

              <div className="pt-2 border-t border-slate-100">
                {isConfirmOpen ? (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-slate-800">Anda yakin?</p>
                      <p className="text-sm text-slate-400 mt-0.5">Laporan akan langsung dikirim.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:flex gap-3 md:shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsConfirmOpen(false)}
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-[14px] bg-white border border-slate-200 text-slate-600 font-bold text-sm active:scale-[0.98] transition-all hover:bg-slate-50 disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmSend}
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-[14px] bg-crimson text-white font-bold text-sm shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        Ya, Kirim
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="md:flex md:justify-end">
                    <button
                      type="button"
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={!link.trim() || !materi.trim()}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-crimson text-white font-bold py-4 md:py-3.5 md:px-10 text-[15px] rounded-[14px] shadow-md shadow-crimson/20 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-[#7a1727]"
                    >
                      <Send size={16} /><span>Kirim Laporan</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {step === 3 && selectedSession && (
        <>
          <div className="mb-6 md:mb-8 text-center md:text-left">
            <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase mb-1 md:text-xs">Presensi Kelas Online</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Laporan Terkirim!</h2>
            <p className="text-sm text-slate-500 mt-1 md:text-base">Laporan kehadiran online Anda telah berhasil terkirim.</p>
          </div>
          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-12 lg:p-16 md:flex md:items-center md:gap-16">
            <div className="flex justify-center md:flex-1 mb-10 md:mb-0">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-36 h-36 md:w-48 md:h-48 bg-crimson/5 rounded-full animate-ping" />
                <div className="absolute w-28 h-28 md:w-36 md:h-36 bg-crimson/8 rounded-full" />
                <div className="relative w-20 h-20 md:w-24 md:h-24 bg-crimson rounded-full flex items-center justify-center text-white shadow-xl shadow-crimson/30">
                  <Check size={36} strokeWidth={3} />
                </div>
              </div>
            </div>
            <div className="md:flex-1">
              <div className="bg-white rounded-3xl border border-slate-100 md:border-slate-200 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:shadow-md">
                <div className="h-1 bg-crimson" />
                <div className="p-6 md:p-7 text-center">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Detail Presensi Online</p>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 leading-snug">
                    {selectedSession.mata_kuliah}
                    <span className="block text-sm font-medium text-slate-400 mt-0.5">Online · {selectedSession.nama_kelas}</span>
                  </h3>
                  <div className="border-t border-slate-100 pt-5 pb-5">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Dikirim Pada</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-crimson">{currentTime} <span className="text-base font-bold">WIB</span></p>
                  </div>
                  <p className="text-[11px] md:text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-5">
                    Terima kasih telah melaporkan kehadiran Anda. Anda dapat melihat detailnya di menu <span className="font-bold text-slate-700">Riwayat</span>.
                  </p>
                </div>
              </div>
              <button onClick={handleReset} className="mt-4 w-full bg-crimson text-white font-bold py-4 md:text-[15px] rounded-xl md:rounded-2xl shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]">
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </>
      )}
    </AsdosPageShell>
  );
}

