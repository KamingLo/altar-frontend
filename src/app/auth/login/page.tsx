'use client';

import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="h-[100svh] overflow-hidden bg-[#EDF2F4]">
      <Suspense fallback={<div className="text-zinc-500 font-mono text-xs animate-pulse">LOADING_SYSTEM...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
