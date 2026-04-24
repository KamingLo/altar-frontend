'use server';

// Mendefinisikan interface yang lebih ketat untuk menggantikan 'any'
interface AuthPayload {
  email?: string;
  username?: string;
  password?: string;
  otp?: string;
  [key: string]: string | number | boolean | undefined;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: unknown;
  status?: number;
}

export async function sendOtp(payload: AuthPayload): Promise<AuthResponse> {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/auth/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || 'Gagal mengirim OTP',
        error: data?.error || null,
        status: response.status,
      };
    }

    return data;
  } catch (error) {
    // Mencatat log error di sisi server untuk debugging
    console.error('Action sendOtp Error:', error);
    return { success: false, message: 'Internal Server Error', status: 500 };
  }
}

// Action untuk Registrasi
export async function registerUser(payload: AuthPayload): Promise<AuthResponse> {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || 'Registrasi gagal',
        error: data?.error || null,
        status: response.status,
      };
    }

    return data;
  } catch (error) {
    console.error('Action registerUser Error:', error);
    return { success: false, message: 'Internal Server Error', status: 500 };
  }
}