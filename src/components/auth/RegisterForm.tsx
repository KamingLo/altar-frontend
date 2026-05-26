'use client';

import Link from 'next/link';
import { useRegisterForm } from '@/hooks/auth/useRegisterForm';
import { AuthAlert } from './AuthAlert';

export const RegisterForm = () => {
  const {
    formData, setFormData, isLoading, loadingOTP, notification,
    handleRequestOTP, handleRegister
  } = useRegisterForm();

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Create Account
        </h1>
        <p className="text-sm text-zinc-400">
          Lengkapi data untuk bergabung ke ekosistem
        </p>
      </div>

      <AuthAlert message={notification?.text || null} type={notification?.type || 'error'} />

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="email"
          placeholder="Email Address"
          className="w-full p-4 bg-black border border-zinc-800 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-white placeholder:text-zinc-600"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <div className="flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Kode OTP"
            className="w-full p-4 bg-black border border-zinc-800 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-white placeholder:text-zinc-600"
            value={formData.otp_code}
            onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, otp_code: val.slice(0, 6) });
            }}
            required
           />
          <button
            type="button"
            onClick={handleRequestOTP}
            disabled={loadingOTP}
            className="px-6 bg-zinc-800 text-xs text-zinc-300 rounded-2xl hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-50 whitespace-nowrap border border-zinc-700"
          >
            {loadingOTP ? 'Sending...' : 'Req OTP'}
          </button>
        </div>

        <input
          type="text"
          placeholder="Username"
          className="w-full p-4 bg-black border border-zinc-800 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-white placeholder:text-zinc-600"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Create Password"
          className="w-full p-4 bg-black border border-zinc-800 rounded-2xl outline-none focus:border-cyan-500/50 transition-all text-white placeholder:text-zinc-600"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white text-black p-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:bg-zinc-800 mt-2 shadow-lg shadow-white/5"
        >
          {isLoading ? 'Processing...' : 'Register Now'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-zinc-500">
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="text-blue-500 font-bold hover:text-blue-300 transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
};
