'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft, BookOpen, Send, Loader2, AlertCircle } from 'lucide-react';
import { getMyPresensi, submitOnlineAttendance } from '@/lib/actions/presensi';
import { getSessionsByDate, type SessionFromAPI } from '@/lib/actions/jadwal';

import { AsdosOnlineSessionSkeleton, AsdosPageHeader, AsdosPageShell } from '@/components/dashboard/asdos/AsdosUI';
import { getSubstituteSessionId, isOnlineSession } from '@/lib/presensi-mode';
import { useAuth } from '@/hooks/dashboard/useAuth';
import { useOnlinePresensiStore } from '@/store/useOnlinePresensiStore';

function todayIso() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
}

function getSessionTime(session?: SessionFromAPI) {
  const raw = session?.waktu.split(', ').pop() ?? '';
  const [start = '', end = ''] = raw.split(' - ').map(part => part.trim());
  return { start, end, label: raw || '-' };
}

function canShowForOnlineAttendance(session: SessionFromAPI): boolean {
  const [datePart, timePart] = session.waktu.split(', ');
  if (!datePart || datePart !== todayIso()) return false;
  if (!timePart) return true;

  const startTime = timePart.split(' - ')[0]?.trim();
  if (!startTime) return true;

  const [startH, startM] = startTime.split(':').map(Number);
  if (isNaN(startH) || isNaN(startM)) return true;

  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return false;

  const availableFrom = new Date(year, month - 1, day, startH, startM, 0);
  availableFrom.setMinutes(availableFrom.getMinutes() - 15);

  return new Date() >= availableFrom;
}



function TimeField({ label, value, onChange, compact }: { label: string; value: string; onChange: (v: string) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const selectedHour = parseInt(value.split(':')[0] ?? '0') || 0;
  const selectedMin  = parseInt(value.split(':')[1] ?? '0') || 0;
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minListRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const ITEM_H = 36;
    setTimeout(() => {
      if (hourListRef.current) {
        const el = hourListRef.current;
        el.scrollTop = selectedHour * ITEM_H - el.clientHeight / 2 + ITEM_H / 2;
      }
      if (minListRef.current) {
        const el = minListRef.current;
        el.scrollTop = selectedMin * ITEM_H - el.clientHeight / 2 + ITEM_H / 2;
      }
    }, 10);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const setHour = (h: number) => onChange(`${String(h).padStart(2, '0')}:${String(selectedMin).padStart(2, '0')}`);
  const setMin  = (m: number) => onChange(`${String(selectedHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

  const boxCls = compact
    ? 'px-3 py-3.5 md:py-4'
    : 'px-4 py-4 md:py-5';
  const textCls = compact ? 'text-sm' : 'text-base md:text-lg';

  return (
    <div ref={wrapperRef} className="flex flex-col gap-1.5 relative">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-center bg-fog rounded-[14px] gap-1 focus:outline-none focus:ring-2 focus:ring-crimson/30 transition-all ${boxCls}`}
      >
        <span className={`font-bold text-slate-800 tabular-nums w-7 text-center ${textCls}`}>{String(selectedHour).padStart(2, '0')}</span>
        <span className={`text-slate-400 font-bold select-none ${textCls}`}>|</span>
        <span className={`font-bold text-slate-800 tabular-nums w-7 text-center ${textCls}`}>{String(selectedMin).padStart(2, '0')}</span>
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Picker: fixed + centered on mobile, absolute dropdown on desktop */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 md:absolute md:top-full md:left-1/2 md:translate-y-0 md:mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 flex items-center gap-2">
            <div ref={hourListRef} className="h-64 md:h-48 w-16 md:w-12 overflow-y-auto [&::-webkit-scrollbar]:hidden snap-y snap-mandatory">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} onClick={() => setHour(i)}
                  className={`h-12 md:h-10 flex items-center justify-center rounded-xl cursor-pointer text-base md:text-sm font-bold transition-all snap-center ${i === selectedHour ? 'bg-crimson text-white' : 'text-slate-600 active:bg-fog hover:bg-fog'}`}>
                  {String(i).padStart(2, '0')}
                </div>
              ))}
            </div>
            <span className="text-slate-300 font-bold text-xl shrink-0">|</span>
            <div ref={minListRef} className="h-64 md:h-48 w-16 md:w-12 overflow-y-auto [&::-webkit-scrollbar]:hidden snap-y snap-mandatory">
              {Array.from({ length: 60 }, (_, i) => (
                <div key={i} onClick={() => setMin(i)}
                  className={`h-12 md:h-10 flex items-center justify-center rounded-xl cursor-pointer text-base md:text-sm font-bold transition-all snap-center ${i === selectedMin ? 'bg-crimson text-white' : 'text-slate-600 active:bg-fog hover:bg-fog'}`}>
                  {String(i).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function PresensiKelasOnlinePage() {
  const { user } = useAuth();
  const {
    sessions, myPresensi, fetched, fetchedDate,
    isLoading, setData, setLoading, reset,
  } = useOnlinePresensiStore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [waktuMulai, setWaktuMulai] = useState('');
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [materi, setMateri] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [completedSessionIds, setCompletedSessionIds] = useState<Set<string>>(new Set());
  const [submittedSession, setSubmittedSession] = useState<SessionFromAPI | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fetchingRef = useRef(false);

  const MAX_MATERI = 100;

  useEffect(() => {
    if (step === 3) {
      document.getElementById('dashboard-children-container')?.scrollTo(0, 0);
      setCountdown(10);
    } else {
      setCountdown(null);
    }
  }, [step]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { router.push('/asdos'); return; }
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 80)}px`;
  }, [materi]);
  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const onlineSessions = useMemo(() => {
    return sessions
      .filter(isOnlineSession)
      .filter(s => {
        const substituteSessionId = getSubstituteSessionId(s);
        return !completedSessionIds.has(s.id_sesi) && (!substituteSessionId || !completedSessionIds.has(substituteSessionId));
      });
  }, [sessions, completedSessionIds]);
  const selectedSession = onlineSessions.find(s => s.id_sesi === selectedSessionId);
  const successSession = submittedSession ?? selectedSession;

  const partnerPresensi = useMemo(() => {
    if (!selectedSession || !user) return null;
    const substituteSessionId = getSubstituteSessionId(selectedSession);
    const today = todayIso();
    return myPresensi.find(p => {
      const isSameSession = p.id_sesi === selectedSession.id_sesi || (substituteSessionId && p.id_sesi_pengganti === substituteSessionId);
      const isToday = p.tanggal_mengajar?.slice(0, 10) === today;
      const isPartner = p.nama_asdos !== user.username;
      return isSameSession && isToday && isPartner;
    }) || null;
  }, [selectedSession, user, myPresensi]);

  useEffect(() => {
    if (!user?.id) return;
    const today = todayIso();
    if (fetched && fetchedDate === today) {
      // Cache hit — hanya hitung ulang completedIds tanpa network request
      const completedIds = new Set<string>(
        myPresensi
          .filter(p => p.tanggal_mengajar?.slice(0, 10) === today && p.nama_asdos === user.username)
          .flatMap(p => [p.id_sesi, p.id_sesi_pengganti].filter((v): v is string => !!v))
      );
      setCompletedSessionIds(completedIds);
      return;
    }
    // Guard: cegah concurrent fetch jika user object berubah referensi berkali-kali
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    async function fetchSessions() {
      try {
        setLoading(true);
        const [res, presensiRes] = await Promise.all([
          getSessionsByDate(today),
          getMyPresensi(),
        ]);
        const rawPresensi = presensiRes.success ? presensiRes.data ?? [] : [];
        setData(res.success ? res.data ?? [] : [], rawPresensi, today);

        const completedIds = new Set<string>(
          rawPresensi
            .filter(p => p.tanggal_mengajar?.slice(0, 10) === today && p.nama_asdos === user?.username)
            .flatMap(p => [p.id_sesi, p.id_sesi_pengganti].filter((v): v is string => !!v))
        );
        setCompletedSessionIds(completedIds);

        if (res.success && res.data) {
          const firstSession = res.data.find(s => {
            const substituteSessionId = getSubstituteSessionId(s);
            return (
              isOnlineSession(s) &&
              canShowForOnlineAttendance(s) &&
              !completedIds.has(s.id_sesi) &&
              (!substituteSessionId || !completedIds.has(substituteSessionId))
            );
          });
          if (firstSession) {
            const firstTime = getSessionTime(firstSession);
            setSelectedSessionId(firstSession.id_sesi);
            setWaktuMulai(firstTime.start);
            setWaktuSelesai(firstTime.end);
          } else {
            setSelectedSessionId(null);
          }
        }
      } finally {
        fetchingRef.current = false;
      }
    }
    fetchSessions();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (partnerPresensi) {
      setLink(partnerPresensi.link_video || '');
      setMateri(partnerPresensi.deskripsi_materi || '');
    } else {
      setLink('');
      setMateri('');
    }
  }, [partnerPresensi]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    setSubmittedSession(null);
  };

  const handleSelectSession = (session: SessionFromAPI) => {
    const time = getSessionTime(session);
    setSelectedSessionId(session.id_sesi);
    setWaktuMulai(time.start);
    setWaktuSelesai(time.end);
  };


  const handleGoNext = () => {
    if (partnerPresensi) {
      handleConfirmSend();
    } else {
      setStep(2);
    }
  };

  const handleConfirmSend = async () => {
    if (!selectedSession) return;

    const substituteSessionId = getSubstituteSessionId(selectedSession);
    if (completedSessionIds.has(selectedSession.id_sesi) || (substituteSessionId && completedSessionIds.has(substituteSessionId))) {
      setStep(1);
      return;
    }

    let id_asdos_rekan: string | undefined = undefined;
    if (selectedSession) {
      const currentAsdosId = user?.id_asisten;
      const id1 = selectedSession.id_asdos1;
      const id2 = selectedSession.id_asdos2;
      if (currentAsdosId) {
        if (id1 === currentAsdosId) {
          id_asdos_rekan = id2 || undefined;
        } else if (id2 === currentAsdosId) {
          id_asdos_rekan = id1 || undefined;
        } else {
          id_asdos_rekan = id1 || undefined;
        }
      }
    }

    setIsSubmitting(true);
    const res = await submitOnlineAttendance({
      id_sesi: selectedSession.id_sesi,
      waktu_mulai: waktuMulai,
      waktu_selesai: waktuSelesai,
      deskripsi_materi: materi,
      link_video: link,
      menggantikan: selectedSession.tipe_jadwal === 'PENGGANTI' && !!substituteSessionId,
      id_sesi_pengganti: substituteSessionId,
      id_asdos_rekan,
    });

    if (res.success) {
      setSubmittedSession(selectedSession);
      setCompletedSessionIds(prev => {
        const next = new Set(prev);
        next.add(selectedSession.id_sesi);
        if (substituteSessionId) next.add(substituteSessionId);
        return next;
      });
      reset();
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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tidak Ada Jadwal Online Hari Ini</h2>
        <p className="text-slate-500 mb-8 max-w-xs">
          Sesi online hari ini belum tersedia atau presensinya sudah tercatat.
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
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 w-full md:w-[480px]">
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
                        <div className="col-span-2 md:col-span-1 flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengajar</span>
                          <div className="flex flex-col gap-0.5">
                            {(s.pengajar || '-').split(' & ').map((name, i) => (
                              <span key={i} className="text-xs md:text-sm font-bold text-slate-800 leading-snug">{name}</span>
                            ))}
                          </div>
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


            {partnerPresensi && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 mb-2 md:mb-3">
                <p className="text-[11px] md:text-xs font-semibold text-emerald-700 leading-relaxed">
                  Partner Anda ({partnerPresensi.nama_asdos}) sudah mengisi laporan untuk sesi ini. Klik <strong>Kirim Presensi</strong> untuk mengirim presensi Anda secara otomatis.
                </p>
              </div>
            )}

            <div className={`hidden md:flex md:justify-end transition-all duration-300 ${selectedSessionId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
              <button onClick={handleGoNext} disabled={!selectedSessionId || isSubmitting}
                className="bg-crimson text-white font-bold py-3 px-10 text-[15px] rounded-2xl shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-50 flex items-center gap-2">
                {isSubmitting && partnerPresensi ? (
                  <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
                ) : partnerPresensi ? 'Kirim Presensi' : 'Lanjut Isi Laporan'}
              </button>
            </div>
          </div>

          <div className="h-24 md:hidden" />
          <div className={`md:hidden fixed bottom-0 left-0 right-0 px-4 pb-6 z-30 transition-all duration-300 ${selectedSessionId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button onClick={handleGoNext} disabled={!selectedSessionId || isSubmitting}
              className="w-full bg-crimson text-white font-bold py-4 text-[15px] rounded-2xl shadow-xl shadow-crimson/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting && partnerPresensi ? (
                <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
              ) : partnerPresensi ? 'Kirim Presensi' : 'Lanjut Isi Laporan'}
            </button>
          </div>
        </>
      )}

      {step === 2 && selectedSession && (
        <>
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase md:text-xs">Presensi Kelas Online</p>
              <h2 className="text-[22px] md:text-3xl leading-7 md:leading-8 font-extrabold text-[#1F2937]">Isi Laporan</h2>
            </div>
            <button onClick={() => setStep(1)}
              className="shrink-0 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-2xl active:scale-95 transition-all hover:bg-slate-50 shadow-sm">
              <ArrowLeft size={18} />
            </button>
          </div>

          {/* Session info card - like step 1 */}
          <div className="bg-white rounded-[12px] md:rounded-[24px] p-5 md:p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] mb-4 md:mb-5">
            <article className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="flex flex-col gap-0.5 min-w-0 md:w-1/3">
                <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug">{selectedSession.mata_kuliah}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedSession.nama_kelas}</p>
                {selectedSession.tipe_jadwal === 'PENGGANTI' && (
                  <span className="w-fit mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-fog text-ink uppercase">Pengganti</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 flex-1">
                <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                  <span className="text-xs md:text-sm font-bold text-slate-800">{getSessionTime(selectedSession).label}</span>
                </div>
                <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
                  <span className="text-xs md:text-sm font-bold text-slate-800">
                    {new Date(selectedSession.waktu.split(', ')[0]).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-1 flex flex-col gap-0.5 border-l-2 border-slate-100 pl-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengajar</span>
                  <div className="flex flex-col gap-0.5">
                    {(selectedSession.pengajar || '-').split(' & ').map((name, i) => (
                      <span key={i} className="text-xs md:text-sm font-bold text-slate-800 leading-snug">{name}</span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="flex flex-col gap-4">
            <section className="bg-white rounded-[12px] md:rounded-[24px] p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4 w-full">
              {/* Link + Checkin/Checkout in two columns */}
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                {/* Left: link input */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Link Meeting / Rekaman</span>
                  <input type="url" value={link} onChange={e => setLink(e.target.value)} disabled={!!partnerPresensi} placeholder="Masukkan link Teams / rekaman..."
                    className={`w-full bg-fog rounded-[14px] p-3.5 md:p-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crimson/30 transition-all border-0 ${partnerPresensi ? 'cursor-not-allowed opacity-80' : ''}`} />
                </div>

                {/* Right: Checkin + Checkout side by side */}
                <div className="flex flex-row gap-3 w-full md:w-auto shrink-0">
                  <div className="flex-1 md:flex-none"><TimeField label="Checkin" value={waktuMulai} onChange={setWaktuMulai} compact /></div>
                  <div className="flex-1 md:flex-none"><TimeField label="Checkout" value={waktuSelesai} onChange={setWaktuSelesai} compact /></div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-[18px] h-[18px] text-slate-800" strokeWidth={2.5} />
                  <span className="text-sm md:text-base font-bold text-slate-800">Bahasan Materi</span>
                </div>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={materi}
                    onChange={e => { if (partnerPresensi) return; if (e.target.value.length <= MAX_MATERI) setMateri(e.target.value); }}
                    disabled={!!partnerPresensi}
                    placeholder="Ketik detail bahasan materi hari ini..."
                    className={`w-full bg-fog rounded-[14px] p-4 pb-8 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crimson/30 transition-[height] resize-none min-h-[80px] overflow-hidden border-0 ${partnerPresensi ? 'cursor-not-allowed opacity-80' : ''}`}
                  />
                  <div className={`absolute bottom-3 right-4 text-[10px] font-medium bg-fog/80 px-1 ${materi.length >= MAX_MATERI ? 'text-crimson' : 'text-slate-400'}`}>
                    {materi.length} / {MAX_MATERI} huruf
                  </div>
                </div>
              </div>

              {partnerPresensi ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] md:text-xs font-semibold text-emerald-700 leading-relaxed">
                    Link kelas dan bahasan materi sudah diisi oleh partner Anda ({partnerPresensi.nama_asdos}). Form dikunci agar laporan tetap konsisten.
                  </p>
                </div>
              ) : (
                <p className="text-[10px] md:text-xs text-crimson font-medium leading-relaxed">
                  * Mohon isi bahasan materi dengan jelas. Jika mengajar bersama partner asisten dosen, pastikan bahasan materi yang diisi sama.
                </p>
              )}

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

      {step === 3 && successSession && (
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
                    {successSession.mata_kuliah}
                    <span className="block text-sm font-medium text-slate-400 mt-0.5">Online · {successSession.nama_kelas}</span>
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
              <button onClick={() => router.push('/asdos')} className="mt-4 w-full bg-crimson text-white font-bold py-4 md:text-[15px] rounded-xl md:rounded-2xl shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]">
                Kembali ke Beranda
              </button>
              {countdown !== null && (
                <p className="text-center text-xs text-slate-400 mt-3">
                  Diarahkan otomatis dalam <span className="font-bold text-slate-600">{countdown}s</span>
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </AsdosPageShell>
  );
}

