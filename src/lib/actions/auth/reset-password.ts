'use server';

export async function resetPasswordAction(data: {
  email: string;
  token: string;
  new_password: string;
}) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, message: result.message || 'Gagal memperbarui kata sandi' };
    }

    return { success: true, message: 'Kata sandi berhasil diperbarui' };
  } catch {
    return { success: false, message: 'Terjadi kesalahan koneksi ke server' };
  }
}