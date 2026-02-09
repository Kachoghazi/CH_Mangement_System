import { NextResponse } from 'next/server';
import { decrypt, canAccessRoute, ROLES } from '@/lib/session';

// Routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/forgot-password'];

// Routes that require authentication (protected)
const protectedRoutePrefixes = [
  '/dashboard',
  '/students',
  '/teachers',
  '/courses',
  '/batches',
  '/fees',
  '/attendance',
  '/reports',
  '/settings',
  '/profile',
  '/approvals',
];

// API routes that don't require authentication
const publicApiRoutes = ['/api/auth/login', '/api/auth/signup', '/api/auth/forgot-password'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next();
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutePrefixes.some((prefix) => pathname.startsWith(prefix));

  // Check if it's a protected API route
  const isProtectedApiRoute = pathname.startsWith('/api/') && !isPublicApiRoute;

  // Get session from cookie
  const cookie = request.cookies.get('auth_token')?.value;
  const session = await decrypt(cookie);

  // If authenticated user tries to access login/signup, redirect to dashboard
  if (
    isPublicRoute &&
    session?.userId &&
    (pathname === '/auth/login' || pathname === '/auth/signup')
  ) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If unauthenticated user tries to access protected route
  if ((isProtectedRoute || isProtectedApiRoute) && !session?.userId) {
    if (isProtectedApiRoute) {
      return NextResponse.json({ message: 'Unauthorized - Please login' }, { status: 401 });
    }
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control for protected routes
  if (isProtectedRoute && session?.userId) {
    const userRole = session.role;

    // Check if user has permission to access this route
    if (!canAccessRoute(userRole, pathname)) {
      // Redirect to their dashboard with an error
      const dashboardUrl = new URL('/dashboard', request.url);
      dashboardUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Role-based access control for API routes
  if (isProtectedApiRoute && session?.userId) {
    const userRole = session.role;

    // Admin-only API routes
    const adminOnlyRoutes = ['/api/fees', '/api/settings', '/api/approvals', '/api/teachers'];

    // Check if route requires admin
    const requiresAdmin = adminOnlyRoutes.some((route) => pathname.startsWith(route));

    if (requiresAdmin && userRole !== ROLES.ADMIN) {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Teacher can manage students
    const teacherRoutes = ['/api/students', '/api/batches', '/api/attendance'];
    const isTeacherRoute = teacherRoutes.some((route) => pathname.startsWith(route));

    // Routes that students can access for their own data
    const studentAllowedRoutes = ['/api/students/me', '/api/attendance/mark', '/api/attendance/my'];
    const isStudentAllowedRoute = studentAllowedRoutes.some((route) => pathname.startsWith(route));

    if (isTeacherRoute && userRole === ROLES.STUDENT) {
      // Students can only access their own data
      if (pathname === '/api/students' && request.method === 'GET') {
        // Allow students to fetch student list for viewing (API will filter)
      } else if (!isStudentAllowedRoute) {
        return NextResponse.json(
          { message: 'Forbidden - Insufficient permissions' },
          { status: 403 },
        );
      }
    }
  }

  // Add user info to request headers for API routes
  if (session?.userId) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.userId);
    requestHeaders.set('x-user-role', session.role);
    requestHeaders.set('x-user-email', session.email || '');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
