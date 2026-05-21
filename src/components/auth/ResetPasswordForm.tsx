'use client';

import React, { useEffect } from 'react';
import { useResetPassword } from '@/hooks/auth/useResetPassword';

export function ResetPasswordForm() {
  const { passwords, setPasswords, isLoading, message, token, handleSubmit } = useResetPassword();

  const [showErrorToast, setShowErrorToast] = React.useState(false);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowErrorToast(message?.type === 'error'), 0);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    if (!showErrorToast) return;
    const t = setTimeout(() => setShowErrorToast(false), 5000);
    return () => clearTimeout(t);
  }, [showErrorToast]);

  useEffect(() => {
    const t = setTimeout(() => setShowSuccessToast(message?.type === 'success'), 0);
    return () => clearTimeout(t);
  }, [message]);

  useEffect(() => {
    if (!showSuccessToast) return;
    const t = setTimeout(() => setShowSuccessToast(false), 5000);
    return () => clearTimeout(t);
  }, [showSuccessToast]);

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const renderToasts = () => (
    <>
      <div
        className={`fixed left-1/2 -translate-x-1/2 top-8 z-[100] w-[calc(100%-3rem)] max-w-[400px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showErrorToast ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'
          }`}
      >
        {message?.type === 'error' && (
          <div className="bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl p-4 flex items-center gap-3">
            <div className="bg-[#FCA5A5] bg-opacity-30 p-2 rounded-full text-[#DC2626] shrink-0">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-[#0D1B2A] text-[13px] font-bold leading-tight">{message.text}</span>
          </div>
        )}
      </div>

      <div
        className={`fixed left-1/2 -translate-x-1/2 top-8 z-[100] w-[calc(100%-3rem)] max-w-[400px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showSuccessToast ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'
          }`}
      >
        {message?.type === 'success' && (
          <div className="bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl p-4 flex items-center gap-3">
            <div className="bg-[#86EFAC] bg-opacity-30 p-2 rounded-full text-[#16A34A] shrink-0">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[#0D1B2A] text-[13px] font-bold leading-tight">{message.text}</span>
          </div>
        )}
      </div>
    </>
  );

  const renderFormArea = () => (
    <div className="relative w-full">
      <div className="text-left mb-6" style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}>
        <h1 className="text-[38px] font-extrabold tracking-[-1px] leading-[1.1] mb-3">
          <span className="text-[#0D1B2A]">Update</span><br />
          <span className="text-[#941C2F]">Password.</span>
        </h1>
        <p className="text-[14px] text-[#4B5563] leading-[1.6] font-medium max-w-[280px]">
          Buat kata sandi baru yang kuat untuk akunmu.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[14px] w-full text-left"
        style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s both' }}
      >
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            placeholder="Kata sandi baru"
            className="w-full px-5 py-4 pr-12 bg-white border border-[#E2E8F0] rounded-2xl text-[#0F172A] text-[14px] font-semibold outline-none transition-all duration-200 placeholder:text-[#94A3B8] placeholder:font-medium focus:border-[#941C2F] focus:ring-4 focus:ring-[#941C2F]/10 disabled:opacity-60 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
            value={passwords.new}
            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            required
            minLength={8}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#941C2F] transition-colors"
            tabIndex={-1}
          >
            <EyeIcon open={showNew} />
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Konfirmasi kata sandi baru"
            className="w-full px-5 py-4 pr-12 bg-white border border-[#E2E8F0] rounded-2xl text-[#0F172A] text-[14px] font-semibold outline-none transition-all duration-200 placeholder:text-[#94A3B8] placeholder:font-medium focus:border-[#941C2F] focus:ring-4 focus:ring-[#941C2F]/10 disabled:opacity-60 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#941C2F] transition-colors"
            tabIndex={-1}
          >
            <EyeIcon open={showConfirm} />
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || !token}
          className="flex items-center justify-center w-full bg-[#941C2F] text-white py-4 rounded-2xl text-[15px] font-bold transition-all shadow-[0_8px_25px_-4px_rgba(148,28,47,0.4)] mt-2 active:scale-[0.98] disabled:opacity-70"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Memperbarui...
            </span>
          ) : 'Simpan Kata Sandi'}
        </button>
      </form>

      <div style={{ animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both' }}>
        <a
          href="/auth/login"
          className="w-full mt-6 p-[14px] text-[14px] font-bold text-[#64748B] flex items-center justify-end gap-[6px] hover:text-[#0F172A] transition-colors"
        >
          ← Kembali
        </a>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp {
            from { transform: translateY(22px); }
            to { transform: translateY(0); }
        }
      `}</style>

      {renderToasts()}

      <div className="hidden lg:flex h-screen w-full overflow-hidden items-center bg-[#EDF2F4] font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="relative w-[55%] h-full shrink-0">
          <div
            className="absolute inset-0 bg-[url('/gedung-untar-fl.webp')] bg-cover bg-center bg-no-repeat z-0"
            style={{ opacity: 0.3 }}
          />
          <div className="absolute inset-y-0 right-0 w-[60%] z-10 bg-gradient-to-r from-[#EDF2F4]/0 via-[#EDF2F4]/80 to-[#EDF2F4]" />
        </div>

        <div className="flex flex-col flex-1 justify-center items-start pl-20 pr-16 relative z-20">
          <div className="w-full max-w-[400px]">
            {renderFormArea()}
          </div>
        </div>
      </div>

      <div className="flex lg:hidden h-[100svh] w-full overflow-hidden justify-center bg-[#EDF2F4] font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="relative w-full max-w-[450px] md:max-w-[650px] h-[100svh] bg-[#EDF2F4] flex flex-col overflow-hidden mx-auto shadow-[0_0_40px_rgba(0,0,0,0.05)]">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div
              className="absolute top-0 left-0 right-0 h-[68svh] bg-gray-300 bg-[url('/gedung-untar.png')] bg-cover bg-[center_top]"
              style={{ opacity: 0.3 }}
            />
            <div className="absolute inset-0 z-10" style={{
              background: 'linear-gradient(to top, #EDF2F4 0%, #EDF2F4 40%, rgba(237, 242, 244, 0.9) 52%, rgba(237, 242, 244, 0.55) 63%, rgba(237, 242, 244, 0.15) 74%, transparent 85%)'
            }} />
          </div>

          <div className="relative z-10 flex flex-col flex-1 px-8 py-[5svh]">
            <div className="grow" />
            {renderFormArea()}
          </div>
        </div>
      </div>
    </>
  );
}
