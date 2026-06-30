import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your_very_secure_jwt_secret_key_change_me_in_production'
);

const locales = ['ar'];
const defaultLocale = 'ar';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclude public assets, uploads, and APIs from language routing and auth
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Multi-language (i18n) handling
  // Check if pathname has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale prefix, redirect to default /ar
  if (!pathnameHasLocale) {
    const locale = defaultLocale;
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // Extract locale and subpath
  const segments = pathname.split('/');
  const locale = segments[1];
  const subpath = '/' + segments.slice(2).join('/');

  // 3. Admin dashboard route protection
  if (subpath.startsWith('/admin') && !subpath.startsWith('/admin/login')) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      // Redirect to /admin/login (with language prefix)
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify token
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      if (!payload || !payload.id || !payload.role) {
        throw new Error('Invalid token');
      }
      
      // Token is valid, proceed
      return NextResponse.next();
    } catch (err) {
      // Token is invalid/expired, clear cookie and redirect
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  // Matcher for all routes except static files, APIs, etc.
  matcher: ['/((?!api|_next/static|_next/image|images|uploads|favicon.ico|sitemap.xml).*)'],
};
