import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authUser = request.cookies.get('auth_user');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // 1. If not logged in and not on login page, redirect to /login
  if (!authUser && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If logged in
  if (authUser) {
    // If on login page, redirect to dashboard
    if (isLoginPage) return NextResponse.redirect(new URL('/', request.url));

    try {
      const user = JSON.parse(authUser.value);
      const restrictedPaths = ['/inventory', '/reports', '/staff', '/devices', '/settings'];
      const isRestricted = restrictedPaths.some(path => request.nextUrl.pathname.startsWith(path));

      if (user.role !== 'ADMIN' && isRestricted) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      console.error('Middleware Parse Error:', e);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
