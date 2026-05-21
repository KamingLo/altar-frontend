import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    // JWT uses base64url encoding — convert and add padding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isAsdosPath = pathname.startsWith('/asdos');
  const isKoordinatorPath = pathname.startsWith('/koordinator');
  const isDashboard = pathname === '/dashboard';
  const isAuthPage =
    pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');

  // /dashboard: redirect server-side ke dashboard yang sesuai
  if (isDashboard) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    const payload = decodeJwtPayload(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.redirect(
      new URL(payload.id_koordinator ? '/koordinator' : '/asdos', request.url)
    );
  }

  // Unauthenticated: redirect ke login untuk halaman yang dilindungi
  if ((isAsdosPath || isKoordinatorPath) && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Authenticated: redirect dari auth pages ke dashboard yang sesuai
  if (isAuthPage && token) {
    const payload = decodeJwtPayload(token);
    if (payload?.id_koordinator) {
      return NextResponse.redirect(new URL('/koordinator', request.url));
    }
    return NextResponse.redirect(new URL('/asdos', request.url));
  }

  // Role mismatch: redirect ke dashboard yang benar
  if (token && (isAsdosPath || isKoordinatorPath)) {
    const payload = decodeJwtPayload(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const isAsdos = !!payload.id_asisten;
    const isKoordinator = !!payload.id_koordinator;

    if (isAsdosPath && !isAsdos) {
      return NextResponse.redirect(
        new URL(isKoordinator ? '/koordinator' : '/auth/login', request.url)
      );
    }

    if (isKoordinatorPath && !isKoordinator) {
      return NextResponse.redirect(
        new URL(isAsdos ? '/asdos' : '/auth/login', request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/asdos/:path*',
    '/koordinator/:path*',
    '/auth/login',
    '/auth/register',
  ],
};
