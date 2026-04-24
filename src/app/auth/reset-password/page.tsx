'use client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'; // Pindahkan logika RegisterForm lama ke sini
import { Suspense } from 'react';
export default function RegisterPage() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md z-10 mt-12 md:mt-0">
        <Suspense fallback={<div>Memuat halaman...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthLayout>
  );
}