import { Injectable } from '@nestjs/common';
import { HashProvider } from '../../../shared/providers/hash.provider';
import { UserRepository } from '../../users/repository/users.repository';
import { InvalidCredentials } from '../auth.errors';
import { TokenProvider } from '../providers/token.provider';

export interface LoginUseCaseParams {
  email: string;
  password: string;
}

export interface LoginUseCaseResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(params: LoginUseCaseParams): Promise<LoginUseCaseResult> {
    const user = await this.userRepository.findByEmail(params.email);

    if (!user) {
      throw new InvalidCredentials();
    }

    const isPasswordValid = await this.hashProvider.compare(
      params.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentials();
    }

    const tokens = this.tokenProvider.generateTokens({
      sub: user.id,
      email: user.email,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }
}
