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
  
  // Mengambil data dari URL query params
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validasi dasar di sisi client sebelum kirim ke server
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
        // Gunakan pesan sukses dari backend (misal: "Kata sandi berhasil diperbarui")
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => router.push('/auth/login'), 3000);
      } else {
        // Tampilkan alasan gagal dari backend (misal: "Token kedaluwarsa")
        setMessage({ type: 'error', text: result.message });
        setIsLoading(false);
      }
    } catch {
      // Tangani kegagalan koneksi atau server crash tanpa mengekspos detail teknis
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
    handleSubmit
  };
};