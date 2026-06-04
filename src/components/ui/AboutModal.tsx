'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, QrCode, BookOpen, CalendarSync, ClipboardList, Users } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  { icon: QrCode, label: 'Presensi QR', desc: 'Check-in & check-out via scan kode QR untuk kelas tatap muka.' },
  { icon: BookOpen, label: 'Kelas Online', desc: 'Pencatatan kehadiran & link sesi untuk kelas daring.' },
  { icon: ClipboardList, label: 'Teaching Log', desc: 'Rekap materi mengajar dan riwayat kehadiran lengkap.' },
  { icon: CalendarSync, label: 'Kuliah Pengganti', desc: 'Pengajuan pergantian jadwal kelas secara digital.' },
  { icon: Users, label: 'Manajemen Asdos', desc: 'Koordinator dapat mengelola jadwal dan data asisten dosen.' },
];

const team = [
  { name: 'Kaming', role: '535240175 - Backend Developer' },
  { name: 'Affan Moshe', role: '535240183 - Backend Developer' },
  { name: 'Charless', role: '5352400068 - Frontend Developer' },
  { name: 'Joe Nickson Lie', role: '535240079 - Frontend Developer' },
  { name: 'Delvyn Putra', role: '535240090 - Frontend Developer' },
];

function ModalContent({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="shrink-0 bg-white rounded-t-[28px] px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-crimson tracking-[0.18em] uppercase mb-1">Tentang Aplikasi</p>
          <h2 className="text-[22px] font-extrabold text-[#0D1B2A] leading-tight">
            ALTAR<span className="text-crimson">.</span>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 active:scale-95 transition-all"
        >
          <X size={17} strokeWidth={2.5} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-6 pt-5 pb-8 flex flex-col gap-7">
        <section>
          <p className="text-[14px] text-[#374151] leading-[1.7] font-medium">
            <span className="font-bold text-[#0D1B2A]">ALTAR</span> adalah platform manajemen kehadiran dan pengajaran untuk asisten dosen Universitas Tarumanagara. Sistem ini memusatkan presensi QR, laporan mengajar, dan pengajuan kuliah pengganti dalam satu aplikasi.
          </p>
        </section>

        <section>
          <h3 className="text-[11px] font-black text-slate-400 tracking-[0.16em] uppercase mb-3">Fitur Utama</h3>
          <div className="flex flex-col gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3.5 bg-[#f4f4f5] rounded-2xl px-4 py-3.5">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Icon size={15} className="text-crimson" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0D1B2A] mb-0.5">{label}</p>
                  <p className="text-[12px] text-slate-500 leading-[1.5]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-black text-slate-400 tracking-[0.16em] uppercase mb-3">Tim</h3>
          <div className="flex flex-col gap-2">
            {team.map(({ name, role }) => (
              <div key={name} className="flex items-center gap-3 bg-[#f4f4f5] rounded-2xl px-4 py-3.5">
                <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-crimson/10">
                  <Image src="/icon-512x512.png" alt={name} width={32} height={32} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0D1B2A]">{name}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-[11px] text-slate-300 font-medium">© {new Date().getFullYear()} Altar · Universitas Tarumanagara · Version 1.06.4</p>
      </div>
    </>
  );
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRendered(true);
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      const t = setTimeout(() => { setRendered(false); setDragY(0); }, 320);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-[200] font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div className="hidden sm:flex absolute inset-0 items-center justify-center">
        <div
          className={`relative z-10 w-full max-w-[520px] max-h-[90svh] bg-white rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.18)] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          <ModalContent onClose={onClose} />
        </div>
      </div>

      <div className="sm:hidden absolute inset-0 flex items-end">
        <div
          className="relative z-10 w-full max-h-[90svh] bg-white rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.15)] flex flex-col"
          style={{
            transform: visible ? `translateY(${dragY}px)` : 'translateY(100%)',
            transition: dragY === 0 ? 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
          }}
          onTouchStart={(e) => setStartY(e.touches[0].clientY)}
          onTouchMove={(e) => { const d = e.touches[0].clientY - startY; if (d > 0) setDragY(d); }}
          onTouchEnd={() => { if (dragY > 100) onClose(); else setDragY(0); }}
        >
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />
          <ModalContent onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
