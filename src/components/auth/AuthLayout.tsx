import Link from 'next/link';
import { ReactNode } from 'react';

export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <main className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white overflow-hidden">
    <div className="absolute top-0 w-full max-w-6xl flex items-center justify-between p-8 z-20">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-cyan-500/20">
          A
        </div>
        <span className="text-xl font-bold group-hover:text-cyan-400 transition-colors">Auth-Next</span>
      </Link>
    </div>

    {children}

    <div className="absolute bottom-8 text-center z-20">
      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
        Secured by MSC Ecosystem • 2026
      </p>
    </div>

    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-10%,#1e293b,transparent_60%)] pointer-events-none" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[radial-gradient(circle_at_50%_110%,#083344,transparent_50%)] opacity-30 pointer-events-none" />
  </main>
);
