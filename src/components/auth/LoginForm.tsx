'use client';

import Image from 'next/image';
import { useAuthForm } from '@/hooks/auth/useLoginForm';
import React, { useEffect } from 'react';

export default function LoginForm() {
  const {
    view,
    formData,
    setFormData,
    isLoading,
    errorMessage,
    successMessage,
    toggleView,
    handleManualLogin,
    handleGoogleLogin,
    handleForgotPassword
  } = useAuthForm();

  const [showErrorToast, setShowErrorToast] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);

  useEffect(() => {
    if (errorMessage) {
      setShowErrorToast(true);
    } else {
      setShowErrorToast(false);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => setShowErrorToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  useEffect(() => {
    if (successMessage) {
      setShowSuccessToast(true);
    } else {
      setShowSuccessToast(false);
    }
  }, [successMessage]);

  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => setShowSuccessToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  return (
    <div className="h-[100svh] w-full overflow-hidden flex justify-center bg-[#EDF2F4] font-['Plus_Jakarta_Sans',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(22px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bgEntry {
            from { opacity: 1; }
            to { opacity: 0.5; }
        }
      `}</style>

      <div className="relative w-full max-w-[450px] h-[100svh] bg-[#EDF2F4] flex flex-col overflow-hidden mx-auto shadow-[0_0_40px_rgba(0,0,0,0.05)]">

        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-0 left-0 right-0 h-[68svh] bg-gray-300 bg-[url('/gedung-untar.png')] bg-cover bg-[center_top]"
            style={{ animation: 'bgEntry 0.5s ease-out forwards' }}
          />
          <div className="absolute inset-0 z-10" style={{
            background: 'linear-gradient(to top, #EDF2F4 0%, #EDF2F4 40%, rgba(237, 242, 244, 0.9) 52%, rgba(237, 242, 244, 0.55) 63%, rgba(237, 242, 244, 0.15) 74%, transparent 85%)'
          }} />
        </div>

        <div
          className={`absolute left-6 right-6 top-8 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showErrorToast ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'
            }`}
        >
          {errorMessage && (
            <div className="bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl p-4 flex items-center gap-3">
              <div className="bg-[#FCA5A5] bg-opacity-30 p-2 rounded-full text-[#DC2626] shrink-0">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-[#0D1B2A] text-[13px] font-bold leading-tight">{errorMessage}</span>
            </div>
          )}
        </div>

        <div
          className={`absolute left-6 right-6 top-8 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showSuccessToast ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'
            }`}
        >
          {successMessage && (
            <div className="bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl p-4 flex items-center gap-3">
              <div className="bg-[#86EFAC] bg-opacity-30 p-2 rounded-full text-[#16A34A] shrink-0">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[#0D1B2A] text-[13px] font-bold leading-tight">{successMessage}</span>
            </div>
          )}
        </div>

        <div className="relative z-10 flex flex-col flex-1 px-8 py-[5svh]">
          <div className="grow" />

          <div className="text-left mb-6" style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}>
            <h1 className="text-[38px] font-extrabold tracking-[-1px] leading-[1.1] mb-3">
              {view === 'login' ? (
                <>
                  <span className="text-[#0D1B2A]">Altar</span>
                  <span className="text-[#941C2F]">.</span>
                </>
              ) : (
                <><span className="text-[#0D1B2A]">Reset</span><br /><span className="text-[#941C2F]">Password.</span></>
              )}
            </h1>
            <p className="text-[14px] text-[#4B5563] leading-[1.6] font-medium max-w-[280px]">
              {view === 'login'
                ? 'Masukkan email yang telah terdaftar.'
                : 'Masukkan email terdaftar untuk pemulihan akun.'}
            </p>
          </div>

          <form
            onSubmit={view === 'login' ? handleManualLogin : handleForgotPassword}
            className="flex flex-col gap-[14px] w-full text-left"
            style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s both' }}
          >
            <input
              type="email"
              placeholder="Alamat Email"
              className="w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#0F172A] text-[14px] font-semibold outline-none transition-all duration-200 placeholder:text-[#94A3B8] placeholder:font-medium focus:border-[#941C2F] focus:ring-4 focus:ring-[#941C2F]/10 disabled:opacity-60 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
            />

            {view === 'login' && (
              <>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Kata Sandi"
                    className="w-full px-5 py-4 pr-12 bg-white border border-[#E2E8F0] rounded-2xl text-[#0F172A] text-[14px] font-semibold outline-none transition-all duration-200 placeholder:text-[#94A3B8] placeholder:font-medium focus:border-[#941C2F] focus:ring-4 focus:ring-[#941C2F]/10 disabled:opacity-60 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#941C2F] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex justify-start -mt-1">
                  <button
                    type="button"
                    onClick={() => toggleView('forgot')}
                    className="bg-transparent border-none cursor-pointer text-[13px] font-bold text-[#941C2F] py-1 hover:opacity-80"
                  >
                    Lupa password?
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center w-full bg-[#941C2F] text-white py-4 rounded-2xl text-[15px] font-bold transition-all shadow-[0_8px_25px_-4px_rgba(148,28,47,0.4)] mt-2 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                view === 'login' ? 'Masuk' : 'Kirim'
              )}
            </button>
          </form>

          <div style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both' }}>
            {view === 'login' ? (
              <>
                <div className="flex items-center gap-4 py-6">
                  <div className="grow h-[1px] bg-[#E2E8F0]" />
                  <span className="text-[10px] font-bold text-[#94A3B8] tracking-[1px] uppercase">atau</span>
                  <div className="grow h-[1px] bg-[#E2E8F0]" />
                </div>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full p-4 bg-white border border-[#E2E8F0] rounded-2xl text-[#334155] text-[14px] font-bold flex items-center justify-center gap-3 hover:bg-[#F8FAFC]"
                >
                  <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} height={18} />
                  Lanjutkan dengan Google
                </button>

                <p className="text-center text-[12px] text-[#8A9BAD] font-medium mt-7">
                  Belum punya akses? <span className="text-[#941C2F] font-bold cursor-pointer hover:underline">Hubungi Admin</span>
                </p>
              </>
            ) : (
              <button
                onClick={() => toggleView('login')}
                className="w-full mt-6 p-[14px] text-[14px] font-bold text-[#64748B] flex items-center justify-end gap-[6px] hover:text-[#0F172A]"
              >
                ← Kembali
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}