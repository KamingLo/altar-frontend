import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwtPayload, isJwtExpired } from '@/lib/auth/jwt';

function loginRedirect(request: NextRequest, clearToken: boolean) {
  const url = new URL('/auth/login', request.url);
  if (clearToken) url.searchParams.set('expired', '1');
  const response = NextResponse.redirect(url);
  if (clearToken) {
    response.cookies.delete('auth_token');
  }
  return response;
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isAsdosPath = pathname.startsWith('/asdos');
  const isKoordinatorPath = pathname.startsWith('/koordinator');
  const isDashboard = pathname === '/dashboard';
  const isAuthPage =
    pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');
  const isProtectedPath = isAsdosPath || isKoordinatorPath;

  if (token && isJwtExpired(token) && (isProtectedPath || isDashboard)) {
    return loginRedirect(request, true);
  }

  if (isDashboard) {
    if (!token) {
      return loginRedirect(request, false);
    }
    const payload = decodeJwtPayload(token);
    if (!payload) {
      return loginRedirect(request, true);
    }
    return NextResponse.redirect(
      new URL(payload.id_koordinator ? '/koordinator' : '/asdos', request.url),
    );
  }

  if (isProtectedPath && !token) {
    return loginRedirect(request, false);
  }

  if (isAuthPage && token && !isJwtExpired(token)) {
    const payload = decodeJwtPayload(token);
    if (payload?.id_koordinator) {
      return NextResponse.redirect(new URL('/koordinator', request.url));
    }
    return NextResponse.redirect(new URL('/asdos', request.url));
  }

  if (token && !isJwtExpired(token) && isProtectedPath) {
    const payload = decodeJwtPayload(token);
    if (!payload) {
      return loginRedirect(request, true);
    }

    const isAsdos = !!payload.id_asisten;
    const isKoordinator = !!payload.id_koordinator;

    if (isAsdosPath && !isAsdos) {
      return NextResponse.redirect(
        new URL(isKoordinator ? '/koordinator' : '/auth/login', request.url),
      );
    }

    if (isKoordinatorPath && !isKoordinator) {
      return NextResponse.redirect(
        new URL(isAsdos ? '/asdos' : '/auth/login', request.url),
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
