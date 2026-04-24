import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;
  
  const isDashboardPage = pathname.startsWith('/dashboard');
  
  const isAuthPage = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');

  if (isDashboardPage && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/auth/login', 
    '/auth/register'
  ],
};