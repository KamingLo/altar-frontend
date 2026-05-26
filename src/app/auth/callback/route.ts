import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  if (error || !token) {
    const loginUrl = new URL('/auth/login', request.url);
    if (error) loginUrl.searchParams.set('message', error);
    return NextResponse.redirect(loginUrl);
  }

  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 Hari
  });

  return NextResponse.redirect(new URL('/dashboard', request.url));
}

