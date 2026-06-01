'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordAction } from '@/lib/actions/auth/reset-password';

export const useResetPassword = () => {
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [isExpired, setIsExpired] = useState(() => !email || !token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await resetPasswordAction({
        email,
        token,
        new_password: passwords.new,
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => router.push('/auth/login'), 3000);
      } else {
        const msg = result.message.toLowerCase();
        if (
          msg.includes('kedaluwarsa') ||
          msg.includes('kadarluwarsa') ||
          msg.includes('tidak valid') ||
          msg.includes('expired') ||
          msg.includes('invalid')
        ) {
          setIsExpired(true);
        } else {
          setMessage({ type: 'error', text: result.message });
        }
        setIsLoading(false);
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem' });
      setIsLoading(false);
    }
  };

  return {
    passwords,
    setPasswords,
    isLoading,
    message,
    token,
    isExpired,
    handleSubmit
  };
};
