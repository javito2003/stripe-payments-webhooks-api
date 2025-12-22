/**
 * JWT token payload structure
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * User data attached to request after JWT validation
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
}
