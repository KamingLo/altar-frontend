'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/actions/auth/login';
import { initiateGoogleAuth } from '@/lib/actions/auth/oauth';
import { forgotPassword } from '@/lib/actions/auth/forgot-password';
import { getSession } from '@/lib/actions/auth/session';
import { useUserStore } from '@/store/useUserStore';

export const useAuthForm = (initialError?: string | null) => {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError ?? null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialError) {
      setErrorMessage(initialError);
    }
  }, [initialError]);

  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const setLoadingStore = useUserStore((state) => state.setLoading);

  const toggleView = (newView: 'login' | 'forgot') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setView(newView);
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await loginUser(formData);

      if (result.success) {
        
        if (result.data?.user) {
          setUser(result.data.user);
          setLoadingStore(false);
          router.push('/dashboard');
          return;
        }

const session = await getSession();

        if (session.success && session.data) {
          setUser(session.data);
          setLoadingStore(false);
          router.push('/dashboard');
        } else {
          setErrorMessage(session.message || 'Gagal mengambil profil akun.');
        }
      } else {
        setErrorMessage(result.message);
      }
    } catch {
      
      setErrorMessage('Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await initiateGoogleAuth('web');
      if (result.success && result.data?.data?.url) {
        window.location.href = result.data.data.url;
      } else {
        setErrorMessage(result.message ?? "Gagal terhubung dengan layanan Google.");
      }
    } catch {
      setErrorMessage('Gagal terhubung dengan layanan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await forgotPassword(formData.email);
      if (result.success) {
        setSuccessMessage(result.message);
        setFormData({ ...formData, email: '' });
      } else {
        setErrorMessage(result.message);
      }
    } catch {
      setErrorMessage('Gagal mengirim permintaan pemulihan kata sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    view,
    formData,
    setFormData,
    isLoading,
    errorMessage,
    successMessage,
    toggleView,
    handleManualLogin,
    handleGoogleLogin,
    handleForgotPassword
  };
};