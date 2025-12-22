import type { Request } from 'express';

export type CookieName = 'accessToken' | 'refreshToken';

export class CookieExtractor {
  static fromCookie(cookieName: CookieName): (req: Request) => string | null {
    return (req: Request): string | null => {
      if (!req?.cookies) {
        return null;
      }

      const token = req.cookies[cookieName] as string | undefined;

      if (!token || typeof token !== 'string') {
        return null;
      }

      return token;
    };
  }

  static extractRefreshToken(req: Request): string | null {
    return this.fromCookie('refreshToken')(req);
  }

  static extractAccessToken(req: Request): string | null {
    return this.fromCookie('accessToken')(req);
  }
}
