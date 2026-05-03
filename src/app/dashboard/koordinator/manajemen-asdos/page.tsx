'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { getAsdosList, createAsdos } from '@/lib/actions/asdos';
import type { AsdosSummary, CreateAsdosPayload } from '@/lib/actions/asdos';

const EMPTY_FORM: CreateAsdosPayload = {
  username: '',
  email: '',
  nim: '',
  phone_number: '',
};
const CLOSE_THRESHOLD = 80;

const FIELDS: {
  field: keyof CreateAsdosPayload;
  label: string;
  type: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  filter?: (v: string) => string;
}[] = [
    { field: 'username', label: 'Username', type: 'text' },
    { field: 'email', label: 'Email', type: 'email' },
    { field: 'nim', label: 'NIM', type: 'text', inputMode: 'numeric', filter: (v) => v.replace(/\D/g, '') },
    { field: 'phone_number', label: 'No. Telepon', type: 'tel', inputMode: 'tel', filter: (v) => v.replace(/[^\d+]/g, '') },
  ];

export default function ManajemenAsdosPage() {
  const [list, setList] = useState<AsdosSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateAsdosPayload>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(0);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    const res = await getAsdosList();
    if (res.success && Array.isArray(res.data)) setList(res.data);
    setLoadingList(false);
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(() => setNotif(null), 4000);
    return () => clearTimeout(t);
  }, [notif]);

  const openModal = () => { setForm(EMPTY_FORM); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setDragOffset(0); };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  };
  const handleTouchEnd = () => {
    if (dragOffset > CLOSE_THRESHOLD) closeModal();
    else setDragOffset(0);
  };

  const sheetStyle: React.CSSProperties = showModal
    ? { transform: `translateY(${dragOffset}px)`, transition: dragOffset > 0 ? 'none' : 'transform 300ms ease-out' }
    : { transform: 'translateY(100%)', transition: 'transform 300ms ease-out' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await createAsdos(form);
    setNotif({ type: res.success ? 'success' : 'error', text: res.message ?? '' });
    if (res.success) {
      closeModal();
      fetchList();
    }
    setSubmitting(false);
  };

  return (
    <>
      <div className="animate-fade-up pb-20">
        <div className="flex items-center justify-between mb-6 pt-2">
          <div>
            <p className="text-xs font-semibold text-[#941C2F] tracking-widest uppercase">Manajemen</p>
            <h1 className="text-2xl font-bold text-slate-800">Asisten Dosen</h1>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-[#941C2F] hover:bg-[#7a1727] text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-md active:scale-95 transition-all"
          >
            <UserPlus size={16} />
            Tambah
          </button>
        </div>

        {notif && (
          <div className={`mb-4 px-4 py-3 rounded-2xl text-sm font-medium ${notif.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
            {notif.text}
          </div>
        )}

        {loadingList ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 size={28} className="animate-spin text-[#941C2F]" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-center py-16 text-slate-400 text-sm">Belum ada data asdos</p>
        ) : (
          <div className="space-y-3">
            {list.map((asdos, i) => (
              <div key={asdos.id_asdos ?? String(i)} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#941C2F]/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#941C2F]">{i + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{asdos.username ?? '-'}</p>
                  <p className="text-xs text-slate-400 truncate">NIM: {asdos.nim ?? '-'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${showModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={closeModal}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-[100] w-full max-h-[90vh] flex flex-col bg-[#EDF2F4] rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gray-400/50 rounded-full" />
        </div>

        <div className="px-6 pt-1 pb-8 overflow-y-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Tambah Asdos Baru</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map(({ field, label, type, inputMode, filter }) => (
              <div key={field}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block ml-1">
                  {label}
                </label>
                <input
                  type={type}
                  inputMode={inputMode}
                  required
                  placeholder={`Masukkan ${label.toLowerCase()}`}
                  value={form[field]}
                  onChange={(e) => {
                    const val = filter ? filter(e.target.value) : e.target.value;
                    setForm({ ...form, [field]: val });
                  }}
                  className="w-full bg-white rounded-xl px-4 py-3.5 text-sm text-slate-800 outline-none border border-transparent focus:border-[#941C2F]/30 focus:ring-4 focus:ring-[#941C2F]/10 transition-all shadow-sm"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 bg-[#941C2F] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all shadow-md hover:bg-[#7a1727]"
            >
              {submitting
                ? <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Memproses...</span>
                : 'Simpan Asdos'
              }
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
