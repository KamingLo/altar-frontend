'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuthForm } from '@/hooks/auth/useLoginForm';

export default function LoginForm() {
  const {
    view, formData, setFormData, isLoading, errorMessage, successMessage,
    toggleView, handleManualLogin, handleGoogleLogin, handleForgotPassword
  } = useAuthForm();

  return (
    <div className="w-full max-w-md z-10">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-10 backdrop-blur-xl">
        {/* Header Section */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            {view === 'login' ? 'Welcome Back' : 'Reset Password'}
          </h1>
          <p className="text-sm text-zinc-400">
            {view === 'login' ? 'Gunakan akun universitas' : 'Masukkan email pemulihan'}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center">{errorMessage}</div>}
        {successMessage && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-bold text-center">{successMessage}</div>}

        {/* Form Section */}
        <form onSubmit={view === 'login' ? handleManualLogin : handleForgotPassword} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-4 bg-black border border-zinc-800 rounded-2xl outline-none focus:border-cyan-500/50 text-white disabled:opacity-50"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isLoading}
          />

          {view === 'login' && (
            <>
              <input
                type="password"
                placeholder="Password"
                className="w-full p-4 bg-black border border-zinc-800 rounded-2xl outline-none focus:border-cyan-500/50 text-white disabled:opacity-50"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => toggleView('forgot')} className="text-xs font-bold text-zinc-500 hover:text-cyan-400">Lupa password?</button>
              </div>
            </>
          )}

          <button type="submit" disabled={isLoading} className="w-full bg-white text-black p-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all disabled:bg-zinc-800">
            {isLoading ? 'Processing...' : (view === 'login' ? 'Sign In' : 'Send Reset Link')}
          </button>
        </form>

        {view === 'login' ? (
          <>
            <div className="relative flex items-center py-8">
              <div className="flex-grow border-t border-zinc-800" />
              <span className="mx-4 text-zinc-600 text-[10px] font-bold uppercase">Atau</span>
              <div className="flex-grow border-t border-zinc-800" />
            </div>

            <button onClick={handleGoogleLogin} type="button" disabled={isLoading} className="w-full flex items-center justify-center gap-3 border border-zinc-800 p-4 rounded-2xl font-bold text-white">
              <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width={18} height={18} />
              <span>Continue with Google</span>
            </button>
          </>
        ) : (
          <button onClick={() => toggleView('login')} className="w-full mt-8 text-sm text-white font-bold">Kembali ke halaman masuk</button>
        )}

        <div className="flex justify-center mt-8">
            <p className='text-gray-400 text-sm'>Belum punya akun? &nbsp;</p>
            <Link href="/auth/register" className="text-sm text-blue-500 font-bold hover:text-blue-300 transition-colors">
            Daftar di sini
            </Link>
        </div>
      </div>
    </div>
  );
}