'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CalendarPlus, Info, Check, Trash2, XCircle, ArrowLeft, Calendar, ChevronLeft, ChevronRight, Filter, Bell } from 'lucide-react';
import { createSubstitution, deleteSubstitution, getMySubstitutions } from '@/lib/actions/pergantian-kelas';
import { getRuanganList, getSemesterList } from '@/lib/actions/data-master';
import { getMyScheduleTimeline, getScheduleTimeline, getSessionsByDate } from '@/lib/actions/jadwal';
import { getMyPresensi } from '@/lib/actions/presensi';
import type { RuanganItem, UnifiedJadwalResponse } from '@/types/api';
import type { SessionFromAPI } from '@/lib/actions/jadwal';
import { AsdosPageHeader, AsdosPageShell, AsdosPrimaryButton, AsdosState } from '@/components/dashboard/asdos/AsdosUI';
import { usePengajuanKpStore } from '@/store/usePengajuanKpStore';
import { useUserStore } from '@/store/useUserStore';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { BottomSheet } from '@/components/ui/BottomSheet';

const DROPDOWN_LIMIT = 500;

const SLOT_OPTIONS = [
  { value: 1, label: '07:30 — 09:10' },
  { value: 2, label: '09:30 — 11:10' },
  { value: 3, label: '11:30 — 13:10' },
  { value: 4, label: '13:30 — 15:10' },
  { value: 5, label: '15:30 — 17:10' },
  { value: 6, label: '17:40 — 19:15' },
  { value: 7, label: '19:30 — 21:00' },
];

type KpStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
const statusConfig: Record<KpStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-fog', text: 'text-ink', label: 'MENUNGGU' },
  VERIFIED: { bg: 'bg-emerald-50 border border-emerald-100', text: 'text-emerald-700', label: 'DISETUJUI' },
  REJECTED: { bg: 'bg-rose-50 border border-rose-100', text: 'text-rose-700', label: 'DITOLAK' },
};

function formatDate(iso: string) {
  if (!iso) return '-';
  const datePart = iso.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const d = year && month && day ? new Date(year, month - 1, day) : new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDayDate(iso: string) {
  if (!iso) return '-';
  const datePart = iso.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const d = year && month && day ? new Date(year, month - 1, day) : new Date(iso);
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' });
}

function weekRangeForOffset(offset: number) {
  const today = new Date();
  const dow = today.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToMon + (offset * 7));
  const saturday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 5);
  return { start: toIsoDateFromDate(monday), end: toIsoDateFromDate(saturday) };
}

function weekDaysForOffset(offset: number) {
  const today = new Date();
  const dow = today.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToMon + (offset * 7) + i);
    return toIsoDateFromDate(d);
  });
}

function formatLongDayDate(iso: string) {
  if (!iso) return '-';
  const [year, month, day] = iso.split('-').map(Number);
  const d = year && month && day ? new Date(year, month - 1, day) : new Date(iso);
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatWeekRange(startIso: string, endIso: string) {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const startMonth = start.toLocaleDateString('id-ID', { month: 'long' });
  const endMonth = end.toLocaleDateString('id-ID', { month: 'long' });
  if (sy === ey && sm === em) return `${sd} - ${ed} ${endMonth} ${ey}`;
  if (sy === ey) return `${sd} ${startMonth} - ${ed} ${endMonth} ${ey}`;
  return `${sd} ${startMonth} ${sy} - ${ed} ${endMonth} ${ey}`;
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function parseTimeRangeMinutes(value: string) {
  const matches = [...String(value).matchAll(/(\d{1,2})[:.](\d{2})/g)];
  if (matches.length < 2) return null;
  const start = Number(matches[0][1]) * 60 + Number(matches[0][2]);
  const end = Number(matches[1][1]) * 60 + Number(matches[1][2]);
  return { start, end };
}

function slotRange(option: number) {
  return parseTimeRangeMinutes(SLOT_OPTIONS.find(slot => slot.value === option)?.label ?? '');
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && a.end > b.start;
}

function roomLabel(room: RuanganItem) {
  return `${room.nama_ruangan} (Lantai ${room.lantai})`;
}

function cleanTeacherName(value: string) {
  return value.replace(/\s*\(Pengganti\)\s*/gi, '').trim();
}

function getTeacherNames(session?: SessionFromAPI) {
  return (session?.pengajar ?? '')
    .split('&')
    .map(name => cleanTeacherName(name))
    .filter(Boolean);
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDateFromDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatInputDate(iso: string) {
  if (!iso) return null;
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function DatePickerField({
  value,
  min,
  onChange,
  align = 'left',
  disableSundays = false,
}: {
  value: string;
  min?: string;
  onChange: (value: string) => void;
  align?: 'left' | 'right';
  disableSundays?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? parseLocalDate(value) : new Date());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value) setViewDate(parseLocalDate(value));
  }, [value]);

  const minDate = min ? parseLocalDate(min) : null;
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const offset = monthStart.getDay();
  const days = Array.from({ length: monthEnd.getDate() }, (_, i) =>
    new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1),
  );

  const changeMonth = (delta: number) =>
    setViewDate(c => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  const pickDate = (date: Date) => {
    onChange(toIsoDateFromDate(date));
    setViewDate(date);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full bg-white border border-slate-200 rounded-[14px] px-5 py-[15px] text-sm text-left font-semibold transition-all flex items-center justify-between focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300"
      >
        <span className={value ? 'text-slate-700' : 'text-slate-400'}>
          {formatInputDate(value) ?? 'Pilih tanggal'}
        </span>
        <Calendar size={18} className="text-slate-400 shrink-0" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Tutup kalender"
            onClick={() => setOpen(false)}
          />
          <div className={`absolute top-[calc(100%+8px)] z-40 w-[280px] bg-white border border-slate-100 rounded-[20px] p-4 shadow-xl ${align === 'right' ? 'right-0' : 'left-0'}`}>
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50">
                <span className="sr-only">Bulan sebelumnya</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <p className="text-sm font-bold text-slate-800 capitalize">
                {viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
              <button type="button" onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50">
                <span className="sr-only">Bulan berikutnya</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => (
                <div key={`${day}-${i}`} className="h-7 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, i) => <div key={i} />)}
              {days.map(day => {
                const iso = toIsoDateFromDate(day);
                const selected = iso === value;
                const disabled = (minDate ? day < minDate : false) || (disableSundays && day.getDay() === 0);
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => pickDate(day)}
                    className={`h-9 rounded-xl text-xs font-bold transition-all ${
                      selected
                        ? 'bg-crimson text-white'
                        : disabled
                          ? 'text-slate-300 cursor-not-allowed'
                          : sameMonth(day, viewDate)
                            ? 'text-slate-700 hover:bg-slate-50'
                            : 'text-slate-300'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function PengajuanKpPage() {
  const { items: history, setPage, removeItem, reset } = usePengajuanKpStore();
  const { user } = useUserStore();
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isSchedulePickerOpen, setIsSchedulePickerOpen] = useState(false);
  const [isNotifPopupOpen, setIsNotifPopupOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [originalDate, setOriginalDate] = useState('');
  const [substituteDate, setSubstituteDate] = useState('');
  const [idSession, setIdSession] = useState('');
  const [idRuangan, setIdRuangan] = useState('');
  const [slotOption, setSlotOption] = useState(1);
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clientToday, setClientToday] = useState('');
  const [ruanganList, setRuanganList] = useState<RuanganItem[]>([]);
  const [sessionList, setSessionList] = useState<SessionFromAPI[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<UnifiedJadwalResponse[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekLoading, setWeekLoading] = useState(false);
  const formBoxRef = useRef<HTMLDivElement>(null);
  const [formBoxHeight, setFormBoxHeight] = useState<number | null>(null);
  const notifBannerRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | KpStatus>('ALL');
  const [checkedInKeys, setCheckedInKeys] = useState<Set<string>>(new Set());
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [occupiedSchedules, setOccupiedSchedules] = useState<Array<{ room: string; time: string; title: string }>>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [dropdownError, setDropdownError] = useState<string | null>(null);
  const [coveredByOtherIds, setCoveredByOtherIds] = useState<Set<string>>(new Set());
  const [coveredByOtherList, setCoveredByOtherList] = useState<Array<{ id_sesi: string; mata_kuliah: string; nama_kelas: string; original_date: string; substitute_date: string }>>([]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await getMySubstitutions();
      if (res.success && res.data) {
        setPage(1, res.data.items, res.data.total);
        const coveredItems = res.data.items.filter(
          item => item.status !== 'REJECTED' && item.id_asdos1 !== user?.id_asisten && !!item.session?.id_sesi,
        );
        setCoveredByOtherIds(new Set(coveredItems.map(item => item.session!.id_sesi)));
        const seen = new Set<string>();
        const uniqueList: Array<{ id_sesi: string; mata_kuliah: string; nama_kelas: string; original_date: string; substitute_date: string }> = [];
        for (const item of coveredItems) {
          const id = item.session!.id_sesi;
          if (seen.has(id)) continue;
          seen.add(id);
          uniqueList.push({
            id_sesi: id,
            mata_kuliah: item.session?.mata_kuliah ?? 'Mata kuliah tidak tersedia',
            nama_kelas: item.session?.nama_kelas ?? '',
            original_date: item.original_date,
            substitute_date: item.substitute_date,
          });
        }
        setCoveredByOtherList(uniqueList);
      } else {
        setHistoryError(res.message || 'Gagal memuat riwayat pengajuan.');
      }
    } catch (e: unknown) {
      setHistoryError(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setHistoryLoading(false);
    }
  }, [setPage, user?.id_asisten]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { setClientToday(todayIso()); }, []);

useEffect(() => {
    let cancelled = false;
    setDropdownLoading(true);
    setDropdownError(null);
    Promise.all([
      getRuanganList(1, '', DROPDOWN_LIMIT),
      getSemesterList(1, '', 50),
    ]).then(([ruanganRes, semesterRes]) => {
      if (cancelled) return;
      if (!ruanganRes.success) setDropdownError(ruanganRes.message || 'Gagal memuat daftar ruangan.');
      setRuanganList(ruanganRes.success ? ruanganRes.data?.items ?? [] : []);
      const semesters = semesterRes.success ? semesterRes.data?.items ?? [] : [];
      setSelectedSemesterId(semesters[0]?.id ?? '');
    }).catch((e: unknown) => {
      if (cancelled) return;
      setDropdownError(e instanceof Error ? e.message : 'Gagal memuat data form.');
    }).finally(() => { if (!cancelled) setDropdownLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isFormOpen || !selectedSemesterId) return;
    let cancelled = false;
    setDropdownError(null);
    setWeekLoading(true);
    const { start, end } = weekRangeForOffset(weekOffset);
    Promise.all([
      getMyScheduleTimeline({ start_date: start, end_date: end, id_semester: selectedSemesterId }),
      getMyPresensi(),
    ]).then(([timelineRes, presensiRes]) => {
      if (cancelled) return;
      if (!timelineRes.success) {
        setDropdownError(timelineRes.message || 'Gagal memuat jadwal minggu ini.');
        setWeekSchedule([]);
        return;
      }
      setWeekSchedule(timelineRes.data?.items ?? []);
      const keys = new Set<string>(
        (presensiRes.success ? presensiRes.data ?? [] : [])
          .flatMap(item => {
            const date = String(item.tanggal_mengajar ?? '').split('T')[0];
            if (!date) return [];
            return [item.id_sesi, item.id_sesi_pengganti]
              .filter((value): value is string => !!value)
              .map(id => `${date}|${id}`);
          }),
      );
      setCheckedInKeys(keys);
    }).catch((e: unknown) => {
      if (cancelled) return;
      setDropdownError(e instanceof Error ? e.message : 'Gagal memuat jadwal minggu ini.');
      setWeekSchedule([]);
    }).finally(() => { if (!cancelled) setWeekLoading(false); });
    return () => { cancelled = true; };
  }, [isFormOpen, selectedSemesterId, weekOffset]);

  useEffect(() => {
    if (!isFormOpen || isMobile) {
      setFormBoxHeight(null);
      return;
    }
    const el = formBoxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const size = entry.borderBoxSize?.[0]?.blockSize;
        setFormBoxHeight(typeof size === 'number' ? size : entry.target.getBoundingClientRect().height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFormOpen, isMobile]);

  useEffect(() => {
    if (!idSession || !originalDate) {
      setSessionList([]);
      return;
    }
    let cancelled = false;
    getSessionsByDate(originalDate).then((res) => {
      if (cancelled || !res.success) return;
      setSessionList(res.data ?? []);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [idSession, originalDate]);

  useEffect(() => {
    if (!substituteDate || !selectedSemesterId) {
      setOccupiedSchedules([]);
      return;
    }

    let cancelled = false;
    getScheduleTimeline({
      start_date: substituteDate,
      end_date: substituteDate,
      id_semester: selectedSemesterId,
    }).then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setOccupiedSchedules([]);
        return;
      }

      setOccupiedSchedules((res.data?.items ?? []).map(item => ({
        room: item.ruangan,
        time: item.waktu,
        title: `${item.mata_kuliah} ${item.nama_kelas}`.trim(),
      })));
    }).catch(() => {
      if (!cancelled) setOccupiedSchedules([]);
    });

    return () => { cancelled = true; };
  }, [substituteDate, selectedSemesterId]);

  const handleOpenSheet = () => { setIsFormOpen(true); setSubmitError(null); };

  const handleCloseSheet = () => {
    if (isSuccess || submitLoading) return;
    setIsFormOpen(false);
    setOriginalDate(''); setSubstituteDate(''); setIdSession('');
    setIdRuangan(''); setSlotOption(1); setReason(''); setSubmitError(null);
    setWeekOffset(0);
  };

  const handleOpenDelete = (id: string) => {
    setTargetDeleteId(id); setIsDeleteOpen(true); setDeleteError(null);
  };

  const handleCloseDelete = () => {
    if (deletingId) return;
    setIsDeleteOpen(false); setTargetDeleteId(null); setDeleteError(null);
  };

  const handleSubmit = async () => {
    const selectedSession = sessionList.find(session => session.id_sesi === idSession);
    const currentAsdosId = user?.id_asisten ?? null;
    const partnerId = selectedSession?.id_asdos1 === currentAsdosId
      ? selectedSession?.id_asdos2
      : selectedSession?.id_asdos2 === currentAsdosId
        ? selectedSession?.id_asdos1
        : selectedSession?.id_asdos2 ?? null;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const res = await createSubstitution({
        id_session: idSession,
        id_ruangan: idRuangan,
        id_asdos1: currentAsdosId ?? selectedSession?.id_asdos1 ?? null,
        id_asdos2: partnerId ?? null,
        substitute_date: substituteDate,
        original_date: originalDate,
        slot_option: slotOption,
        reason,
      });
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          handleCloseSheet();
          reset();
          fetchHistory();
        }, 2000);
      } else {
        setSubmitError(res.message || 'Gagal mengajukan kelas pengganti.');
      }
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!targetDeleteId) return;
    setDeletingId(targetDeleteId);
    setDeleteError(null);
    try {
      const res = await deleteSubstitution(targetDeleteId);
      if (res.success) {
        removeItem(targetDeleteId);
        handleCloseDelete();
      } else {
        setDeleteError(res.message || 'Gagal membatalkan pengajuan.');
      }
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = useMemo(
    () => statusFilter === 'ALL' ? history : history.filter(item => item.status === statusFilter),
    [history, statusFilter],
  );

  const myWeekSchedule = useMemo(() => {
    const myUsername = user?.username?.toLowerCase();
    if (!myUsername) return weekSchedule;
    return weekSchedule.filter(s => s.pengajar.toLowerCase().includes(myUsername));
  }, [weekSchedule, user?.username]);

  const weekDays = useMemo(() => {
    const days = weekDaysForOffset(weekOffset);
    return days.map(iso => ({
      iso,
      sessions: myWeekSchedule
        .filter(s => s.tanggal.split('T')[0] === iso)
        .slice()
        .sort((a, b) => a.waktu.localeCompare(b.waktu)),
    }));
  }, [myWeekSchedule, weekOffset]);

  const isFormValid =
    originalDate.trim() !== '' && substituteDate.trim() !== '' &&
    idSession.trim() !== '' && idRuangan.trim() !== '' && reason.trim() !== '';

  const selectedSession = sessionList.find(session => session.id_sesi === idSession);
  const teacherNames = getTeacherNames(selectedSession);
  const currentAsdosId = user?.id_asisten ?? null;
  const originalPartnerId = selectedSession?.id_asdos1 === currentAsdosId
    ? selectedSession?.id_asdos2
    : selectedSession?.id_asdos2 === currentAsdosId
      ? selectedSession?.id_asdos1
      : selectedSession?.id_asdos2 ?? null;
  const originalPartnerName = selectedSession?.id_asdos1 === currentAsdosId
    ? teacherNames[1]
    : selectedSession?.id_asdos2 === currentAsdosId
      ? teacherNames[0]
      : teacherNames[1] ?? teacherNames[0];
  const selectedSlotRange = slotRange(slotOption);
  const selectedRoom = ruanganList.find(room => room.id === idRuangan);
  const selectedRoomLabel = selectedRoom ? roomLabel(selectedRoom) : '';
  const roomConflict = !!(selectedSlotRange && selectedRoomLabel && occupiedSchedules.some(item => {
    const occupiedRange = parseTimeRangeMinutes(item.time);
    return item.room === selectedRoomLabel && !!occupiedRange && overlaps(selectedSlotRange, occupiedRange);
  }));

  const occupiedRoomLabels = new Set(
    selectedSlotRange
      ? occupiedSchedules
        .filter(item => {
          const occupiedRange = parseTimeRangeMinutes(item.time);
          return !!occupiedRange && overlaps(selectedSlotRange, occupiedRange);
        })
        .map(item => item.room)
      : [],
  );

  const occupiedSlotOptions = new Set(
    selectedRoomLabel
      ? SLOT_OPTIONS
        .filter(slot => {
          const range = slotRange(slot.value);
          return !!range && occupiedSchedules.some(item => {
            const occupiedRange = parseTimeRangeMinutes(item.time);
            return item.room === selectedRoomLabel && !!occupiedRange && overlaps(range, occupiedRange);
          });
        })
        .map(slot => slot.value)
      : [],
  );

  const selectedSessionCheckedIn = !!idSession && !!originalDate && checkedInKeys.has(`${originalDate}|${idSession}`);
  const sessionAlreadyCovered = !!idSession && coveredByOtherIds.has(idSession);
  const canSubmit = isFormValid && !roomConflict && !selectedSessionCheckedIn && !sessionAlreadyCovered;

  const renderCoveredBanner = (ref?: React.RefObject<HTMLDivElement | null>) => {
    if (coveredByOtherList.length === 0 || historyLoading) return null;
    return (
      <div
        ref={ref}
        className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5 text-sm text-blue-700"
      >
        <Info className="w-[18px] h-[18px] mt-0.5 shrink-0 text-blue-500" strokeWidth={2.5} />
        <div className="flex-1">
          <p className="font-bold">Sudah ada pengajuan dari rekan Anda</p>
          <p className="font-medium text-blue-600/80 mt-0.5">
            Asisten dosen lain sudah mengajukan Kelas Pengganti untuk:
          </p>
          <ul className="mt-1.5 space-y-1.5 font-semibold text-blue-700">
            {coveredByOtherList.map(item => (
              <li key={item.id_sesi} className="flex gap-2 leading-relaxed">
                <span className="text-blue-400">•</span>
                <span>
                  {item.mata_kuliah}
                  {item.nama_kelas && <span className="font-medium text-blue-600/80"> ({item.nama_kelas})</span>}
                  <span className="block font-medium text-blue-600/80 text-[13px]">
                    {formatDate(item.original_date)} → {formatDate(item.substitute_date)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="font-medium text-blue-600/80 mt-1.5">
            Anda tidak perlu mengajukan lagi untuk sesi-sesi tersebut.
          </p>
        </div>
      </div>
    );
  };

  const renderSchedulePanel = (onPick?: () => void) => (
    <>
      <div className="flex items-center justify-between gap-2 mb-5">
        <h3 className="text-[10px] font-bold text-slate-400/90 tracking-widest uppercase ml-1 truncate">
          {weekOffset === 0
            ? 'Jadwal Minggu Ini'
            : formatWeekRange(weekRangeForOffset(weekOffset).start, weekRangeForOffset(weekOffset).end)}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {weekOffset > 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(o => Math.max(0, o - 1))}
              aria-label="Minggu sebelumnya"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setWeekOffset(o => o + 1)}
            aria-label="Minggu berikutnya"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      {weekLoading || dropdownLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-4 border-crimson/20 border-t-crimson rounded-full animate-spin" />
        </div>
      ) : weekDays.every(d => d.sessions.length === 0) ? (
        <p className="text-sm text-slate-400 italic ml-1">
          Tidak ada jadwal pada minggu ini.
        </p>
      ) : (
        <div className="space-y-5">
          {weekDays.map(day => (
            <div key={day.iso}>
              <p className="text-sm font-bold text-slate-800 mb-2.5 ml-1">
                {formatLongDayDate(day.iso)}
              </p>
              {day.sessions.length === 0 ? (
                <p className="text-xs text-slate-400 italic ml-1">Tidak ada jadwal</p>
              ) : (
                <div className="space-y-2">
                  {day.sessions.map(s => {
                    const isCheckedIn = checkedInKeys.has(`${day.iso}|${s.id_sesi}`);
                    const isCovered = coveredByOtherIds.has(s.id_sesi);
                    const isDisabled = isCheckedIn || isCovered;
                    const isActive = idSession === s.id_sesi;
                    const timeOnly = s.waktu.split(', ')[1] ?? s.waktu;
                    return (
                      <button
                        key={s.id_sesi}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setIdSession(s.id_sesi);
                          setOriginalDate(day.iso);
                          onPick?.();
                        }}
                        className={`w-full text-left rounded-xl px-3.5 py-3 border transition-all ${
                          isActive
                            ? 'bg-crimson/5 border-crimson/40 ring-1 ring-crimson/30 shadow-sm'
                            : isDisabled
                              ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-[11px] font-bold text-slate-500 tracking-wide">{timeOnly}</p>
                        <p className="text-sm font-bold text-slate-800 leading-snug mt-0.5">
                          {s.mata_kuliah}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          {s.ruangan}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {s.nama_kelas} <span className="text-[10px] text-slate-400/90 font-normal">· {s.pengajar}</span>
                          {isCheckedIn && <span className="ml-1 text-amber-600 font-semibold">· Check-in</span>}
                          {isCovered && !isCheckedIn && <span className="ml-1 text-blue-600 font-semibold">· Diajukan rekan</span>}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderFormContent = () => {
    if (isSuccess) {
      return (
        <div className="h-56 md:h-64 flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-28 h-28 bg-crimson/5 rounded-full animate-ping" />
            <div className="absolute w-20 h-20 bg-crimson/10 rounded-full" />
            <div className="relative w-14 h-14 bg-crimson rounded-full flex items-center justify-center text-white shadow-lg shadow-crimson/30">
              <Check size={28} strokeWidth={3} />
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-[#1F2937] mb-1">Pengajuan Berhasil!</h2>
          <p className="text-sm text-slate-500">Formulir Kelas Pengganti Anda telah disubmit.</p>
        </div>
      );
    }

    return (
      <>
        {dropdownLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 border-4 border-crimson/20 border-t-crimson rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 pt-2 flex-1">
            {dropdownError && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold">
                ⚠️ {dropdownError}
              </div>
            )}

            <div className="md:hidden">
              <label className="block text-[10px] md:text-[11px] font-bold text-slate-400/90 tracking-widest uppercase mb-2.5 ml-1">
                Sesi yang Diganti
              </label>
              <button
                type="button"
                onClick={() => setIsSchedulePickerOpen(true)}
                className="w-full bg-white border border-slate-200 rounded-[14px] px-5 py-[15px] text-sm text-left font-semibold flex items-center justify-between focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300"
              >
                {(() => {
                  const picked = myWeekSchedule.find(s => s.id_sesi === idSession);
                  if (!picked) {
                    return <span className="text-slate-400">-- Pilih Sesi --</span>;
                  }
                  const timeOnly = picked.waktu.split(', ')[1] ?? picked.waktu;
                  return (
                    <span className="flex flex-col text-slate-700 leading-tight">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        {formatDayDate(picked.tanggal)} · {timeOnly}
                      </span>
                      <span className="text-sm font-bold text-slate-800 mt-0.5">{picked.mata_kuliah}</span>
                      <span className="text-xs text-slate-500 font-medium mt-0.5">{picked.nama_kelas}</span>
                    </span>
                  );
                })()}
                <Calendar size={18} className="text-slate-400 shrink-0 ml-3" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] md:text-[11px] font-bold text-slate-400/90 tracking-widest uppercase mb-2.5 ml-1">
                Tanggal Kelas Pengganti
              </label>
              <DatePickerField value={substituteDate} min={clientToday} onChange={setSubstituteDate} disableSundays />
            </div>

            <div>
              <label className="block text-[10px] md:text-[11px] font-bold text-slate-400/90 tracking-widest uppercase mb-2.5 ml-1">
                Partner Asisten Dosen
              </label>
              <div className="w-full bg-slate-50 border border-slate-200 rounded-[14px] px-5 py-4">
                <p className="text-sm font-bold text-slate-800">
                  {idSession && originalPartnerId ? originalPartnerName ?? 'Partner asli' : '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] md:text-[11px] font-bold text-slate-400/90 tracking-widest uppercase mb-2.5 ml-1">
                  Slot Jam
                </label>
                <CustomSelect
                  value={String(slotOption)}
                  onChange={val => setSlotOption(Number(val))}
                  triggerClassName="!rounded-[14px] !py-[15px] !border-slate-200 hover:!border-slate-300 !bg-white !font-semibold"
                  options={SLOT_OPTIONS.map(s => ({
                    value: String(s.value),
                    label: s.label,
                    description: occupiedSlotOptions.has(s.value) ? 'Ruangan terpilih sudah terpakai' : undefined,
                    disabled: occupiedSlotOptions.has(s.value),
                  }))}
                  placeholder="-- Pilih --"
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-[11px] font-bold text-slate-400/90 tracking-widest uppercase mb-2.5 ml-1">
                  Ruangan
                </label>
                <CustomSelect
                  value={idRuangan}
                  onChange={setIdRuangan}
                  triggerClassName="!rounded-[14px] !py-[15px] !border-slate-200 hover:!border-slate-300 !bg-white !font-semibold"
                  options={ruanganList.map(r => ({
                    value: r.id,
                    label: r.nama_ruangan,
                    description: occupiedRoomLabels.has(roomLabel(r))
                      ? `Lantai ${r.lantai} · sudah terpakai`
                      : `Lantai ${r.lantai}`,
                    disabled: occupiedRoomLabels.has(roomLabel(r)),
                  }))}
                  placeholder="-- Pilih --"
                />
              </div>
            </div>

            {sessionAlreadyCovered && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5 text-sm text-blue-700">
                <Info className="w-[18px] h-[18px] mt-0.5 shrink-0 text-blue-500" strokeWidth={2.5} />
                <div>
                  <p className="font-bold">Sesi ini sudah diajukan KP</p>
                  <p className="font-medium text-blue-600/80 mt-0.5">
                    Asisten dosen lain sudah mengajukan Kelas Pengganti untuk sesi ini. Anda tidak perlu mengajukan lagi.
                  </p>
                </div>
              </div>
            )}

            {(selectedSessionCheckedIn || roomConflict) && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700 font-semibold leading-relaxed">
                {selectedSessionCheckedIn
                  ? 'Sesi ini sudah tercatat check-in, sehingga tidak bisa diajukan sebagai kelas pengganti.'
                  : 'Ruangan dan slot jam yang dipilih sudah terpakai. Silakan pilih slot atau ruangan lain.'}
              </div>
            )}

            <div>
              <label className="block text-[10px] md:text-[11px] font-bold text-slate-400/90 tracking-widest uppercase mb-2.5 ml-1">
                Alasan Pengajuan
              </label>
              <div className="relative">
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  maxLength={100}
                  placeholder="Masukkan alasan Anda..."
                  className="w-full bg-white border border-slate-200 rounded-[14px] p-5 pb-8 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300 transition-all resize-none h-32 font-semibold"
                />
                <span className={`absolute bottom-3 right-4 text-xs font-semibold pointer-events-none ${reason.length >= 100 ? 'text-crimson' : 'text-slate-400'}`}>
                  {reason.length}/100
                </span>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold">
                ⚠️ {submitError}
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-slate-100 bg-white">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitLoading}
                className="w-full py-[16px] rounded-[20px] bg-crimson hover:bg-[#7a1727] text-white font-bold text-[15px] active:scale-[0.98] transition-all shadow-[0_10px_25px_rgba(148,28,47,0.2)] border border-white/5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitLoading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengirim...</>
                ) : 'Kirim Pengajuan'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <AsdosPageShell hasBottomBar={!isFormOpen && isMobile}>
      <AsdosPageHeader
        eyebrow={(!isMobile && isFormOpen) ? "Formulir" : "Kelas Pengganti"}
        title={(!isMobile && isFormOpen) ? "Ajukan Kelas Pengganti" : "Riwayat Kelas Pengganti"}
        description={(!isMobile && isFormOpen) ? "Isi formulir untuk mengajukan kelas pengganti." : "Daftar pengajuan Kelas Pengganti Anda."}
        action={
          (!isMobile && isFormOpen) ? (
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              {coveredByOtherList.length > 0 && (
                <button
                  type="button"
                  onClick={() => notifBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  aria-label="Lihat notifikasi pengajuan rekan"
                  className="relative w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <Bell size={18} />
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-crimson text-white text-[10px] font-bold flex items-center justify-center">
                    {coveredByOtherList.length}
                  </span>
                </button>
              )}
              <button
                onClick={handleCloseSheet}
                disabled={submitLoading || isSuccess}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} /> Kembali
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <div className="relative hidden md:block">
                <CustomSelect
                  variant="icon"
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v as 'ALL' | KpStatus)}
                  options={[
                    { value: 'ALL', label: 'Semua status' },
                    { value: 'PENDING', label: 'Menunggu' },
                    { value: 'VERIFIED', label: 'Disetujui' },
                    { value: 'REJECTED', label: 'Ditolak' },
                  ]}
                  icon={<Filter size={18} />}
                  triggerClassName="!p-3 !rounded-xl"
                  align="right"
                />
                {statusFilter !== 'ALL' && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-crimson pointer-events-none" />
                )}
              </div>
              <AsdosPrimaryButton onClick={handleOpenSheet} icon={<CalendarPlus size={18} />} className="hidden md:flex py-3 px-6 text-[15px]">
                Ajukan Kelas Pengganti
              </AsdosPrimaryButton>
            </div>
          )
        }
      />

      <div className="relative w-full overflow-hidden">
        <div
          className="flex md:w-[200%] w-full transform-gpu"
          style={{
            transform: !isMobile && isFormOpen ? 'translateX(-50%)' : 'translateX(0)',
            transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className={`md:w-1/2 w-full shrink-0 transition-opacity duration-300 ${(!isMobile && isFormOpen) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

            <div className="flex flex-col gap-6 w-full pb-28 md:pb-8">
              {historyLoading && (
                <div className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 border border-slate-100 flex flex-col gap-6 w-full animate-pulse">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-col gap-3 w-full md:w-1/3">
                      <div className="h-6 md:h-8 w-3/4 rounded-lg bg-slate-100" />
                      <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-2 md:flex gap-4 md:gap-8 w-full md:w-auto">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="border-l-2 border-slate-100 pl-4 space-y-2">
                          <div className="h-3 w-14 rounded bg-slate-100" />
                          <div className="h-4 w-20 rounded bg-slate-100" />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3">
                      <div className="h-9 w-24 rounded-xl bg-slate-100" />
                      <div className="h-9 w-9 rounded-xl bg-slate-100 md:hidden" />
                    </div>
                  </div>

                  <div className="bg-fog rounded-[12px] md:rounded-[20px] p-5 space-y-3">
                    <div className="h-4 w-40 rounded bg-slate-200/70" />
                    <div className="h-4 w-full rounded bg-slate-200/70" />
                    <div className="h-4 w-2/3 rounded bg-slate-200/70" />
                  </div>
                  <p className="sr-only">Memuat riwayat...</p>
                </div>
              )}

              {historyError && !historyLoading && <AsdosState variant="error" message={historyError} />}

              {!historyLoading && !historyError && filteredHistory.length === 0 && (
                <div className="bg-white border border-slate-100 rounded-[12px] md:rounded-[32px] p-6 md:p-8 text-center">
                  <div className="mx-auto mb-4 w-12 h-12 rounded-[14px] bg-fog flex items-center justify-center text-slate-500">
                    <CalendarPlus size={20} />
                  </div>
                  <p className="text-base md:text-lg text-slate-800 font-bold">
                    {statusFilter === 'ALL' ? 'Belum ada pengajuan.' : 'Tidak ada pengajuan dengan filter ini.'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {statusFilter === 'ALL'
                      ? 'Anda dapat mengajukan kelas pengganti menggunakan tombol "Ajukan Kelas Pengganti".'
                      : 'Coba ubah filter status untuk melihat pengajuan lain.'}
                  </p>
                </div>
              )}

              {!historyLoading && !historyError && filteredHistory.map(item => {
                const cfg = statusConfig[item.status];
                const isPending = item.status === 'PENDING';
                const session = item.session;
                return (
                  <section
                    key={item.id}
                    className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 border border-slate-100 flex flex-col gap-6 w-full"
                  >
                    <article className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

                      <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 leading-snug line-clamp-2">
                          {session?.mata_kuliah ?? 'Mata kuliah tidak tersedia'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">
                          {session?.nama_kelas ?? 'Kelas tidak tersedia'}
                        </p>
                      </div>

                      <div className="flex flex-row gap-6 md:gap-8 w-full md:w-auto flex-wrap">
                        <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tgl Asli</span>
                          <span className="text-sm md:text-base font-bold text-slate-800">{formatDate(item.original_date)}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tgl Pengganti</span>
                          <span className="text-sm md:text-base font-bold text-slate-800">{formatDate(item.substitute_date)}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                          <span className="text-sm md:text-base font-bold text-slate-800">{item.time_slot}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ruangan</span>
                          <span className="text-sm md:text-base font-bold text-slate-800">{item.room}</span>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center justify-between md:justify-start md:items-end gap-2 mt-2 md:mt-0 w-full md:w-auto shrink-0">
                        <span className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        {isPending && (
                          <button
                            onClick={() => handleOpenDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 transition-colors disabled:opacity-50">
                            {deletingId === item.id
                              ? <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-500 rounded-full animate-spin" />
                              : <Trash2 size={16} />
                            }
                          </button>
                        )}
                      </div>

                    </article>

                    <div className={`bg-fog rounded-[20px] p-5 grid grid-cols-1 ${item.status === 'REJECTED' && item.coordinator_reason ? 'md:grid-cols-[1fr_auto_1fr] gap-6' : 'gap-2'}`}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-slate-800">
                          <Info className="w-[18px] h-[18px] text-slate-800" strokeWidth={2.5} />
                          <span className="text-sm md:text-base font-bold text-slate-800">Alasan Pengajuan</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 ml-1 leading-relaxed">
                          &quot;{item.reason}&quot;
                        </p>
                      </div>

                      {item.status === 'REJECTED' && item.coordinator_reason && (
                        <>
                          <div className="hidden md:block w-px self-stretch rounded-full bg-slate-300/60" />
                          <div className="flex flex-col gap-2 pt-4 md:pt-0">
                            <div className="flex items-center gap-2 text-slate-800">
                              <XCircle className="w-[18px] h-[18px] text-crimson" strokeWidth={2.5} />
                              <span className="text-sm md:text-base font-bold text-slate-800">Alasan Ditolak</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1 ml-1 leading-relaxed">
                              {item.coordinator_reason}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                  </section>
                );
              })}

              {!historyLoading && !historyError && filteredHistory.length > 0 && (
                <p className="text-xs font-medium text-slate-400 text-center mt-2">
                  Menampilkan {filteredHistory.length} {statusFilter === 'ALL' ? 'pengajuan kelas pengganti' : `pengajuan berstatus ${statusConfig[statusFilter].label.toLowerCase()}`}.
                </p>
              )}
            </div>
          </div>

          {!isMobile && (
            <div className={`md:w-1/2 w-full shrink-0 transition-opacity duration-300 ${isFormOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="max-w-5xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
                  <aside
                    className="hidden md:block bg-white rounded-[12px] p-6 border border-slate-100 overflow-y-auto"
                    style={{ height: formBoxHeight ?? undefined, maxHeight: formBoxHeight ?? 'calc(100vh - 160px)' }}
                  >
                    {renderSchedulePanel()}
                  </aside>
                  <div
                    ref={formBoxRef}
                    className="bg-white rounded-[12px] p-6 md:p-8 border border-slate-100 flex flex-col w-full self-start max-h-[calc(100vh-160px)] overflow-y-auto"
                  >
                    {renderFormContent()}
                  </div>
                </div>
                {coveredByOtherList.length > 0 && (
                  <div className="mt-6">
                    {renderCoveredBanner(notifBannerRef)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isFormOpen && (
        <div className="md:hidden fixed bottom-5 right-5 z-10 flex flex-col items-end gap-3">
          {coveredByOtherList.length > 0 && (
            <button
              type="button"
              onClick={() => setIsNotifPopupOpen(true)}
              aria-label="Lihat notifikasi"
              className="relative w-14 h-14 rounded-full bg-white border border-slate-200 shadow-lg text-slate-700 flex items-center justify-center active:scale-95 transition-all"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-crimson text-white text-[10px] font-bold flex items-center justify-center">
                {coveredByOtherList.length}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenSheet}
            aria-label="Ajukan Kelas Pengganti"
            className="w-14 h-14 rounded-full bg-crimson text-white shadow-lg shadow-crimson/30 flex items-center justify-center active:scale-95 transition-all"
          >
            <CalendarPlus size={22} />
          </button>
        </div>
      )}

      <BottomSheet
        isOpen={isFormOpen && isMobile}
        onClose={handleCloseSheet}
        title="Ajukan Kelas Pengganti"
        subtitle="Isi formulir untuk mengajukan kelas pengganti."
        maxWidthClassName="max-w-xl"
      >
        <div className="pt-2">
          {renderFormContent()}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isSchedulePickerOpen}
        onClose={() => setIsSchedulePickerOpen(false)}
        title="Pilih Sesi yang Diganti"
        subtitle="Pilih dari jadwal mingguan Anda."
        maxWidthClassName="max-w-xl"
      >
        <div className="pt-2">
          {renderSchedulePanel(() => setIsSchedulePickerOpen(false))}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isNotifPopupOpen}
        onClose={() => setIsNotifPopupOpen(false)}
        title="Notifikasi"
        subtitle="Pengajuan dari rekan Anda."
        maxWidthClassName="max-w-md"
      >
        <div className="pt-2">
          {renderCoveredBanner()}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isDeleteOpen}
        onClose={handleCloseDelete}
        maxWidthClassName="max-w-sm"
      >
        <div className="pt-4 pb-2">
          <div className="flex items-center justify-center w-14 h-14 bg-rose-50 rounded-2xl mx-auto mb-5 text-crimson">
            <Trash2 size={24} />
          </div>
          <h2 className="text-[20px] font-extrabold text-[#1F2937] text-center leading-7 mb-2">
            Batalkan Pengajuan?
          </h2>
          <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
            Apakah Anda yakin ingin membatalkan pengajuan kelas pengganti ini? Tindakan ini tidak dapat dibatalkan.
          </p>

          {deleteError && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold mb-6 flex items-center gap-2 text-left">
              <span>⚠️</span>
              <span className="flex-1">{deleteError}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={confirmDelete}
              disabled={!!deletingId}
              className="w-full py-4 rounded-2xl bg-crimson text-white font-bold text-[15px] shadow-md shadow-crimson/20 hover:bg-[#7a1727] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {deletingId
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Ya, Batalkan'
              }
            </button>
            <button
              onClick={handleCloseDelete}
              disabled={!!deletingId}
              className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-[15px] hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      </BottomSheet>
    </AsdosPageShell>
  );
}
