import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../users/repository/users.repository';
import { TokenPair, TokenProvider } from '../providers/token.provider';
import { InvalidRefreshToken } from '../auth.errors';

export interface RefreshTokenUseCaseParams {
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(params: RefreshTokenUseCaseParams): Promise<TokenPair> {
    try {
      const payload = this.tokenProvider.verifyRefreshToken(
        params.refreshToken,
      );

      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new InvalidRefreshToken();
      }

      return this.tokenProvider.generateTokens({
        sub: user.id,
        email: user.email,
      });
    } catch {
      throw new InvalidRefreshToken();
    }
  }
}
