import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface TokenPayload {
  sub: string;
  email: string;
}

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

  generateTokens(payload: TokenPayload): TokenPair {
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

  verifyRefreshToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token, {
      secret: this.refreshTokenSecret,
    });
  }
}
