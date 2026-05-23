import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  // Jika ada error dari backend
  if (error || !token) {
    const loginUrl = new URL('/auth/login', request.url);
    if (error) loginUrl.searchParams.set('message', error);
    return NextResponse.redirect(loginUrl);
  }

  // 1. Simpan token ke HttpOnly Cookie secara instan di level server
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 Hari
  });

  // 2. Langsung lempar ke Dashboard
  // Dashboard akan menangani loading via DashboardLoading.tsx & sinkronisasi Zustand via useAuth.ts
  return NextResponse.redirect(new URL('/dashboard', request.url));
}

