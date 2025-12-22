import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenProvider {
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTokenSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'your-refresh-secret-key',
    );
    this.refreshTokenExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    );
  }

  generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    const accessToken = this.jwtService.sign({ ...payload });

    const refreshToken = this.jwtService.sign(
      { ...payload },
      {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenExpiresIn as `${number}d`,
      },
    );

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.refreshTokenSecret,
    });
  }
}
