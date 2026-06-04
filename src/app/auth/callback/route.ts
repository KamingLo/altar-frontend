import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ERROR_MESSAGES: Record<string, string> = {
  user_not_registered: 'Akun Google ini belum terdaftar.',
  token_exchange_failed: 'Gagal verifikasi dengan Google. Coba lagi.',
  fetch_user_failed: 'Gagal mengambil data dari Google. Coba lagi.',
  parse_failed: 'Terjadi kesalahan saat memproses akun Google. Coba lagi.',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  if (error || !token) {
    const loginUrl = new URL('/auth/login', origin);
    if (error) {
      const friendlyMessage = ERROR_MESSAGES[error] ?? 'Terjadi kesalahan saat login dengan Google. Coba lagi.';
      loginUrl.searchParams.set('message', friendlyMessage);
    }
    return NextResponse.redirect(loginUrl);
  }

  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.redirect(new URL('/dashboard', origin));
}
