import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-[100svh] bg-canvas" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

