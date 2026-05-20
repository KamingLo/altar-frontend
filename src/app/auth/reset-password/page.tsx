import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-[100svh] bg-[#EDF2F4]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
