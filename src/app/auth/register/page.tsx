'use client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm'; // Pindahkan logika RegisterForm lama ke sini

export default function RegisterPage() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md z-10 mt-12 md:mt-0">
        <RegisterForm />
      </div>
    </AuthLayout>
  );
}
