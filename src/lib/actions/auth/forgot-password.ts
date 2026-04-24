'use server';

export async function forgotPassword(email: string) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Gagal mengirim permintaan reset password',
      };
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan pada sistem, silakan coba lagi nanti',
    };
  }
}