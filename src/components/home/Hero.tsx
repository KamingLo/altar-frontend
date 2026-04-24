import Link from 'next/link';

export const Hero = () => (
  <section className="flex flex-col items-center text-center mt-10 w-full max-w-5xl px-6 z-10 relative">
    <div className="mb-6 flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs md:text-sm font-medium text-zinc-300">
      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
      Optimized for Kaming&quot;s MSC Ecosystem
    </div>
    
    <h1 className="text-5xl md:text-7xl font-bold mb-8">
      One Frontend. <br /> 
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
        Infinite Backends.
      </span>
    </h1>
    
    <p className="text-base md:text-xl text-zinc-400 mb-12 max-w-3xl mx-auto">
      Auth-Next menyediakan koneksi mulus ke template backend MSC buatan kaming. 
      Siap digunakan untuk validasi alur autentikasi secara instan.
    </p>
    
    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
      <Link href="/auth/login" className="px-10 py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center hover:bg-zinc-200 transition-all shadow-xl shadow-white/5">
        Test Login
      </Link>
      <Link href="/auth/register" className="px-10 py-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-all font-bold flex items-center justify-center">
        Register Now
      </Link>
    </div>
  </section>
);