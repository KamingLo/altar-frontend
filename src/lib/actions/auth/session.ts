'use server';

import { cookies } from 'next/headers';

// Action untuk mengambil data user saat ini (pengganti /auth/me)
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return { sSuccess: false, message: 'Unauthorized', status: 401 };
  }

  try {
    const response = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Hapus cache agar data profil selalu fresh (opsional, tergantung kebutuhan)
      cache: 'no-store' 
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || 'Sesi habis',
        status: response.status,
      };
    }

    // Mengembalikan response sukses dari Golang
    return data;
  } catch (error) {
    console.error('Action getSession Error:', error);
    return { success: false, message: 'Internal Server Error', status: 500 };
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    // 1. Panggil Backend Go untuk hapus session gothic
    // Kita tetap kirim token supaya backend tahu siapa yang logout (jika perlu)
    await fetch(`${process.env.BACKEND_URL}/auth/logout`, {
      method: 'GET', // atau GET sesuai routemu di Go
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // 2. Hapus cookie di sisi Next.js
    cookieStore.delete('auth_token');
    
    // Ini biasanya tidak ngefek kalau domainnya beda port, 
    // tapi hapus saja buat jaga-jaga
    cookieStore.delete("_gothic_session"); 

    return { success: true, message: 'Berhasil logout' };
  } catch (error) {
    console.error('Action logoutUser Error:', error);
    return { success: false, message: 'Gagal logout', status: 500 };
  }
}