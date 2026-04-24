'use server';

import { cookies } from 'next/headers';

export async function initiateGoogleAuth(platform: string = 'web') {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/auth/google?platform=${platform}`, {
      method: 'GET',
      // fetch bawaan tidak menggunakan withCredentials, melainkan credentials: 'include' 
      // jika memanggil API eksternal yang butuh cookie bawaan server Node.js.
      // Tapi di sini kita bertindak sebagai proxy.
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: 'Gagal inisiasi Google', status: response.status };
    }

    // Menangkap set-cookie header dari Golang dan memindahkannya ke Next.js Cookie
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders.length > 0) {
      const cookieStore = await cookies();
      
      setCookieHeaders.forEach((cookieString) => {
        // Parsing dasar untuk memecah string cookie dari backend
        const parts = cookieString.split(';');
        const [nameValue] = parts[0].split('=');
        const name = nameValue.trim();
        const value = parts[0].substring(name.length + 1);
        
        // Teruskan cookie (seperti csrf_state Google) ke browser
        cookieStore.set(name, value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          sameSite: 'lax',
        });
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error('Google Auth Init Error:', error);
    return { success: false, message: 'Gagal inisiasi Google', status: 500 };
  }
}