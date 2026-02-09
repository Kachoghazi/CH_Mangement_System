import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.NEXTAUTH_SECRET || 'dev-secret-key';
const encodedKey = new TextEncoder().encode(secretKey);

/**
 * Encrypt session payload
 */
export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

/**
 * Decrypt session from token
 */
export async function decrypt(session) {
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.log('Failed to verify session', error);
    return null;
  }
}

/**
 * Get session from cookie value (for middleware)
 */
export async function getSession(cookieValue) {
  if (!cookieValue) return null;
  return decrypt(cookieValue);
}

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

// Route permissions - what each role can access
export const ROLE_ROUTES = {
  // Routes accessible by students
  student: [
    '/dashboard',
    '/attendance/mark',
    '/attendance/my-attendance',
    '/profile',
    '/courses',
    '/courses/enroll',
    '/courses/my-courses',
    '/schedule',
    '/fees/my-fees',
  ],

  // Routes accessible by teachers
  teacher: [
    '/dashboard',
    '/attendance/mark',
    '/attendance',
    '/profile',
    '/students',
    '/batches',
    '/courses',
    '/schedule',
  ],

  // Admin can access everything
  admin: [
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
    '/schedule',
  ],
};

// Routes that require approval
export const APPROVAL_REQUIRED_ROUTES = {
  student: ['/courses/enroll'],
  teacher: [],
};

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role, pathname) {
  if (!role) return false;

  // Admin can access everything
  if (role === ROLES.ADMIN) return true;

  const allowedRoutes = ROLE_ROUTES[role] || [];

  // Check if the pathname starts with any allowed route
  return allowedRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
}
