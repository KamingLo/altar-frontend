'use client';

import { useResetPassword } from '@/hooks/auth/useResetPassword';

export function ResetPasswordForm() {
  const { 
    passwords, 
    setPasswords, 
    isLoading, 
    message, 
    token, 
    handleSubmit 
  } = useResetPassword();

  return (
    <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Kata Sandi Baru</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Buat kata sandi yang kuat untuk akun kamu</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border ${
          message.type === 'error' 
            ? 'bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900/50' 
            : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50'
        }`}>
          <p className={`text-sm font-bold text-center ${
            message.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Kata sandi baru"
          className="w-full p-4 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900 transition-colors dark:bg-black dark:border-zinc-700 dark:focus:border-zinc-50 disabled:opacity-50"
          value={passwords.new}
          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
          required
          minLength={8}
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Konfirmasi kata sandi baru"
          className="w-full p-4 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900 transition-colors dark:bg-black dark:border-zinc-700 dark:focus:border-zinc-50 disabled:opacity-50"
          value={passwords.confirm}
          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
          required
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading || !token}
          className="w-full bg-zinc-950 text-white p-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:bg-zinc-300 dark:bg-zinc-50 dark:text-black dark:disabled:bg-zinc-800"
        >
          {isLoading ? 'Memperbarui...' : 'Simpan Kata Sandi'}
        </button>
      </form>
    </div>
  );
}