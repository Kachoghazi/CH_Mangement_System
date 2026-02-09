import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-key';
const TOKEN_NAME = 'auth_token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Hash a password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Set auth cookie
 */
export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
}

/**
 * Get auth cookie
 */
export async function getAuthCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}

/**
 * Remove auth cookie
 */
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

/**
 * Get current user from token
 */
export async function getCurrentUser() {
  const token = await getAuthCookie();
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return decoded;
}

/**
 * Create session payload
 */
export function createSessionPayload(user, profile) {
  return {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: profile?.name || user.email,
    profileId: profile?._id?.toString(),
  };
}
