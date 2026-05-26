"use client";
import React from 'react';

const HeroDesktop = () => {
  return (
    <div className="min-h-screen w-full flex items-center bg-canvas font-['Plus_Jakarta_Sans',sans-serif]">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="relative w-[55%] self-stretch shrink-0"
        style={{ animation: 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}
      >
        <div className="absolute inset-0 bg-[url('/gedung-untar-fl.webp')] bg-cover bg-center bg-no-repeat z-0" />
        <div
          className="absolute inset-y-0 right-0 w-[60%] z-10 bg-gradient-to-r from-canvas/0 via-canvas/80 to-canvas"
        />
      </div>

      <div className="flex flex-col flex-1 justify-center items-start gap-10 pl-20 pr-16 relative z-20">

        <div
          className="text-left"
          style={{ animation: 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}
        >
          <h1 className="text-[56px] font-extrabold text-[#0D1B2A] tracking-[-1px] leading-[1.1] mb-5">
            Selamat Datang di<br />
            <span className="text-crimson">ALTAR.</span>
          </h1>
          <p className="text-[18px] text-[#6B7280] leading-[1.6] font-medium max-w-[450px] m-0">
            Sistem QR untuk presensi, teaching log, dan pengajuan kuliah pengganti asisten dosen secara terpusat.
          </p>
        </div>

        <div
          className="flex flex-col items-start gap-4"
          style={{ animation: 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.35s both' }}
        >
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center px-16 bg-crimson text-white py-[18px] rounded-full text-[16px] font-bold no-underline cursor-pointer transition-all duration-200 ease-out shadow-[0_8px_24px_rgba(148,28,47,0.3)] hover:shadow-[0_12px_32px_rgba(148,28,47,0.4)] hover:-translate-y-1 active:scale-[0.97] active:translate-y-0"
          >
            Masuk
          </a>
          <p className="text-left text-[13px] text-[#8A9BAD] font-medium mt-2">
            © Altar - Universitas Tarumanagara
          </p>
        </div>

      </div>

    </div>
  );
};

const HeroMobile = () => {
  return (
    <div className="min-h-[100svh] w-full flex bg-canvas font-['Plus_Jakarta_Sans',sans-serif]">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative w-full min-h-[100svh] bg-canvas flex flex-col">

        <div
          className="relative w-full h-[58svh] shrink-0"
          style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}
        >
          <div className="absolute inset-0 bg-gray-300 bg-[url('/gedung-untar.png')] bg-cover bg-[center_top] z-0" />
          <div
            className="absolute inset-0 z-10"
            style={{
              background: 'linear-gradient(to top, #f4f4f5 0%, #f4f4f5 12%, rgba(244, 244, 245, 0.85) 22%, rgba(244, 244, 245, 0.55) 35%, rgba(244, 244, 245, 0.2) 50%, transparent 65%)'
            }}
          />
        </div>

        <div className="bg-canvas px-[clamp(2rem,6vw,4rem)] pb-[clamp(3rem,8vw,4rem)] flex flex-col flex-1 justify-between relative z-20">

          <div
            className="flex flex-col items-start md:items-center text-left md:text-center"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}
          >
            <h1 className="text-[clamp(32px,8vw,48px)] font-extrabold text-[#0D1B2A] tracking-[-0.5px] leading-[1.1] mb-[clamp(12px,3vw,20px)]">
              Selamat Datang di<br />
              <span className="text-crimson">ALTAR.</span>
            </h1>
            <p className="text-[clamp(14px,3.5vw,18px)] text-[#6B7280] leading-[1.6] font-medium max-w-[clamp(280px,80vw,450px)] m-0">
              Sistem QR untuk presensi, teaching log, dan pengajuan kuliah pengganti asisten dosen secara terpusat.
            </p>
          </div>

          <div
            className="w-full mt-6 flex flex-col items-center"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both' }}
          >
            <a
              href="/auth/login"
              className="flex items-center justify-center w-full max-w-[400px] bg-crimson text-white py-[clamp(18px,4vw,22px)] rounded-full text-[clamp(16px,4vw,18px)] font-bold no-underline cursor-pointer mb-4 transition-all duration-150 ease-out shadow-[0_8px_24px_rgba(148,28,47,0.3)] tracking-[0.2px] active:scale-[0.97] active:shadow-[0_4px_12px_rgba(148,28,47,0.2)]"
            >
              Masuk
            </a>
            <p className="text-center w-full text-[clamp(12px,3vw,14px)] text-[#8A9BAD] font-medium">
              © Altar - Universitas Tarumanagara
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export const Hero = () => {
  return (
    <>
      <div className="lg:hidden">
        <HeroMobile />
      </div>
      <div className="hidden lg:block">
        <HeroDesktop />
      </div>
    </>
  );
};

