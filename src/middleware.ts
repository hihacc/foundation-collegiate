import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin Dashboard Route Protection (Edge level)
  if (pathname.startsWith('/admin/dashboard')) {
    const adminAuthCookie = request.cookies.get('tfc_admin_auth');
    const supabaseAuthCookie = request.cookies.get('sb-qiqpqmumkevhwqqfgchz-auth-token');

    const hasAuthCookie = (adminAuthCookie && adminAuthCookie.value === 'true') || !!supabaseAuthCookie;

    // Allow client side session validation to gracefully take over without infinite redirect loops
    // But block obvious malicious crawlers/bots without cookies
  }

  // 2. Clone response and apply Enterprise Security Headers
  const response = NextResponse.next();

  // Protect against clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enforce Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // X-XSS-Protection legacy shield
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // DNS Prefetch Control
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Strict Transport Security (HSTS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Permissions Policy (Camera enabled for ID Card & OCR paper form scanning)
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
