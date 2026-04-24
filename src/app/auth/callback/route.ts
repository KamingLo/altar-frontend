import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  // Jika ada error dari backend (misal: user batal login atau gagal)
  if (error || !token) {
    const loginUrl = new URL('/auth/login', request.url);
    if (error) loginUrl.searchParams.set('message', error);
    
    return NextResponse.redirect(loginUrl);
  }

  // 1. Simpan token ke HttpOnly Cookie agar aman dari XSS
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 Hari
  });

  // 2. Lempar user ke Dashboard
  // Pastikan path '/dashboard' sesuai dengan routing di frontend kamu
  return NextResponse.redirect(new URL('/dashboard', request.url));
}