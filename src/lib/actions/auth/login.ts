'use server';

import { cookies } from 'next/headers';

// Mengganti 'any' dengan tipe yang lebih spesifik
interface AuthPayload {
  email?: string;
  username?: string;
  password?: string;
  [key: string]: string | number | boolean | undefined;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user?: {
      id: string;
      email: string;
      name: string;
    };
  };
}

export async function loginUser(payload: AuthPayload) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Menentukan tipe data hasil response.json()
    const data: LoginResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || 'Login gagal',
        status: response.status,
      };
    }

    const token = data?.data?.token;

    if (!token) {
      return { 
        success: false, 
        message: 'Token tidak ditemukan', 
        status: 401 
      };
    }

    const cookieStore = await cookies();
    
    // Opsional: Langsung menimpa cookie lama seringkali lebih efisien daripada delete lalu set
    cookieStore.set('auth_token', token);

    return { 
      success: true, 
      message: 'Login berhasil', 
      data: data?.data 
    };
  } catch (error) {
    // Mencatat error tanpa memunculkan error object yang berpotensi sensitif ke client
    console.error('Login Action Error:', error);
    return { 
      success: false, 
      message: 'Server Error', 
      status: 500 
    };
  }
}