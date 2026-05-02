"use client";
import React from 'react';

export const Hero = () => {
  return (
    <div className="h-[100svh] w-full overflow-hidden flex justify-center bg-[#EDF2F4] font-['Plus_Jakarta_Sans',sans-serif]">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative w-full max-w-[450px] h-[100svh] bg-[#EDF2F4] flex flex-col overflow-hidden mx-auto shadow-[0_0_40px_rgba(0,0,0,0.05)]">

        <div
          className="relative w-full h-[58svh] shrink-0"
          style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}
        >
          <div className="absolute inset-0 bg-gray-300 bg-[url('/gedung-untar.png')] bg-cover bg-[center_top] z-0" />

          <div
            className="absolute inset-0 z-10"
            style={{
              background: 'linear-gradient(to top, #EDF2F4 0%, #EDF2F4 12%, rgba(237, 242, 244, 0.85) 22%, rgba(237, 242, 244, 0.55) 35%, rgba(237, 242, 244, 0.2) 50%, transparent 65%)'
            }}
          />
        </div>

        <div className="bg-[#EDF2F4] px-8 pb-12 flex flex-col flex-1 justify-between relative z-20">

          <div
            className="text-left"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}
          >
            <h1 className="text-[32px] font-extrabold text-[#0D1B2A] tracking-[-0.5px] leading-[1.1] mb-3">
              Selamat Datang di<br />
              <span className="text-[#941C2F]">ALTAR.</span>
            </h1>
            <p className="text-[14px] text-[#6B7280] leading-[1.6] font-medium max-w-[280px] m-0">
              Sistem QR untuk presensi, teaching log, dan pengajuan kuliah pengganti asisten dosen secara terpusat.
            </p>
          </div>

          <div
            className="w-full mt-6"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both' }}
          >
            <a
              href="/auth/login"
              className="flex items-center justify-center w-full bg-[#941C2F] text-white py-[18px] rounded-full text-[16px] font-bold no-underline cursor-pointer mb-4 transition-all duration-150 ease-out shadow-[0_8px_24px_rgba(148,28,47,0.3)] tracking-[0.2px] active:scale-[0.97] active:shadow-[0_4px_12px_rgba(148,28,47,0.2)]"
            >
              Masuk
            </a>
            <p className="text-center text-[12px] text-[#8A9BAD] font-medium">
              © Altar - Universitas Tarumanagara
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}