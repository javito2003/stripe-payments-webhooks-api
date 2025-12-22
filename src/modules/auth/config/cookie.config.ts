import type { CookieOptions } from 'express';

export interface TokenCookieConfig {
  name: string;
  options: CookieOptions;
}

export class AuthCookieConfig {
  private readonly isProduction: boolean;

  constructor(nodeEnv?: string) {
    this.isProduction = nodeEnv === 'production';
  }

  getAccessTokenConfig(): TokenCookieConfig {
    return {
      name: 'accessToken',
      options: {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
      },
    };
  }

  getRefreshTokenConfig(): TokenCookieConfig {
    return {
      name: 'refreshToken',
      options: {
        httpOnly: true,
        secure: this.isProduction,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      },
    };
  }
}
