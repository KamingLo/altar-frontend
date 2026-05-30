'use client';

import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-[100svh] bg-canvas">
      <Suspense fallback={<div className="min-h-[100svh] bg-canvas" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

