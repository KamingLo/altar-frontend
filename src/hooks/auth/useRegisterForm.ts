'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtp, registerUser } from '@/lib/actions/auth/register';

export const useRegisterForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    email: '', 
    username: '', 
    otp_code: '', 
    password: '' 
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOTP, setLoadingOTP] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleRequestOTP = async () => {
    if (!formData.email) {
      setNotification({ type: 'error', text: 'Masukkan email terlebih dahulu' });
      return;
    }

    setLoadingOTP(true);
    setNotification(null);

    try {
      const result = await sendOtp({ email: formData.email });

      setNotification({
        type: result.success ? 'success' : 'error', 
        text: result.message 
      });

    } catch {
      setNotification({ type: 'error', text: 'Gagal menghubungi server' });
    } finally {
      setLoadingOTP(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setNotification(null);

    try {
      const result = await registerUser(formData);

      if (result.success) {
        setNotification({ type: 'success', text: result.message });
        setTimeout(() => router.push('/auth/login'), 1500);
      } else {
        setNotification({ type: 'error', text: result.message });
      }

    } catch {
      setNotification({ type: 'error', text: 'Terjadi kesalahan sistem' });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData, 
    setFormData, 
    isLoading, 
    loadingOTP, 
    notification,
    handleRequestOTP, 
    handleRegister
  };
};
