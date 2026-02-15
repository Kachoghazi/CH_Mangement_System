import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const authRoutes = ['/login', '/register'];
const privateRoutes = ['/dashboard', '/profile', '/settings', '/api/student'];

export default withAuth(
  function middleware(req) {
    const { pathname, search } = req.nextUrl;
    const token = req.nextauth.token;

    // Always allow NextAuth endpoints
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }

    // Logged-in user should not see auth pages
    if (token && authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Guest accessing private route → redirect with callbackUrl
    if (!token && privateRoutes.some((route) => pathname.startsWith(route))) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized() {
        return true;
      },
    },
  },
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
