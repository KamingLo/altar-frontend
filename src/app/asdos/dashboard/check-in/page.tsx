'use client';
import React, { useState } from 'react';
import { Check, Scan, ArrowLeft } from 'lucide-react';

const mockSessions = [
  {
    id: 1,
    sessionName: 'SESI 1',
    subject: 'Basis Data',
    room: 'R. 901',
    time: '07:30 - 10:00',
    status: 'Aktif',
  },
  {
    id: 2,
    sessionName: 'SESI 2',
    subject: 'Algoritma Pemrograman',
    room: 'R. Lab 2',
    time: '10:30 - 13:00',
    status: 'Aktif',
  },
  {
    id: 3,
    sessionName: 'SESI 3',
    subject: 'Sistem Operasi',
    room: 'R. 804',
    time: '13:30 - 16:00',
    status: 'Mendatang',
  },
];

export default function CheckInPage() {
  const [step, setStep] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(2);

  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const selectedSession = mockSessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="w-full max-w-md mx-auto font-sans text-slate-800 pb-8 pt-2">
      
      {step === 1 && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Pindai Kode QR</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-16">
            Arahkan kamera Anda ke kode QR yang disediakan oleh Koordinator di depan kelas.
          </p>

          <div 
            className="relative w-64 h-64 mx-auto cursor-pointer active:scale-95 transition-transform"
            onClick={() => setStep(2)}
          >
            <div className="absolute top-0 left-0 w-12 h-12 border-t-[4px] border-l-[4px] border-[#941C2F] rounded-tl-3xl"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-[4px] border-r-[4px] border-[#941C2F] rounded-tr-3xl"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[4px] border-l-[4px] border-[#941C2F] rounded-bl-3xl"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[4px] border-r-[4px] border-[#941C2F] rounded-br-3xl"></div>
            
            <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)] opacity-80"></div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10">
              <Scan size={80} />
            </div>
            
            <div className="absolute -bottom-10 left-0 right-0 text-center text-xs text-slate-400 italic">
              *Klik area ini untuk simulasi scan
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-up">
          <button 
            onClick={() => setStep(1)} 
            className="text-[#941C2F] mb-5 active:scale-95 transition-transform hover:opacity-80"
          >
            <ArrowLeft size={24} />
          </button>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">Pilih Sesi Mengajar</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Pilih jadwal kelas yang akan diajar hari ini.
          </p>

          <div className="space-y-4">
            {mockSessions.map((session) => {
              const isSelected = selectedSessionId === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 shadow-sm
                    ${isSelected 
                      ? 'bg-white border-2 border-[#941C2F] shadow-md' 
                      : 'bg-white border-2 border-transparent hover:border-slate-200'
                    }`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 w-7 h-7 bg-[#941C2F] rounded-full flex items-center justify-center text-white shadow-sm">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wider
                      ${session.status === 'Aktif' ? 'bg-[#941C2F]/10 text-[#941C2F]' : 'bg-slate-100 text-slate-500'}`}>
                      {session.sessionName}
                    </span>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800">{session.room}</p>
                      <p className="text-[10px] text-slate-500">{session.time}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800">{session.subject}</h3>
                  
                  <div className="flex items-center gap-1.5 mt-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${session.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <span className="text-[11px] text-slate-500 font-medium">{session.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <button
              onClick={() => setStep(3)}
              disabled={!selectedSessionId}
              className="w-full bg-[#941C2F] text-white font-semibold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              Check-in Sekarang
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-up flex flex-col items-center text-center mt-2">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Check-in Berhasil!</h1>
          <p className="text-sm text-slate-500 mb-8">
            Kehadiran Anda telah tercatat di sistem.
          </p>

          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute w-32 h-32 bg-[#941C2F]/5 rounded-full animate-ping"></div>
            <div className="absolute w-24 h-24 bg-[#941C2F]/10 rounded-full"></div>
            <div className="relative w-16 h-16 bg-[#941C2F] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#941C2F]/30">
              <Check size={32} strokeWidth={3} />
            </div>
          </div>

          <div className="bg-white w-full p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#941C2F]/20 to-transparent"></div>
            
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Detail Sesi Aktif</p>
            <h2 className="text-lg font-bold text-slate-800 mb-6">
              {selectedSession?.subject} - {selectedSession?.room}
            </h2>

            <div className="border-t border-slate-100 py-5">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Check-in Pada</p>
              <p className="text-xl font-bold text-[#941C2F]">{currentTime} WIB</p>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-5">
              Selamat bertugas! Jangan lupa untuk melakukan <span className="font-bold text-slate-700">Check-out</span> setelah sesi laboratorium berakhir.
            </p>
          </div>
          
          <div className="w-full">
            <button
              onClick={() => setStep(1)}
              className="w-full bg-[#941C2F] text-white font-semibold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}