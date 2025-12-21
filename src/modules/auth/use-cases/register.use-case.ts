import { Injectable } from '@nestjs/common';
import { HashProvider } from '../../../shared/providers/hash.provider';
import { UserRepository } from '../../users/repository/users.repository';
import { EmailAlreadyInUse } from '../auth.errors';
import { TokenProvider } from '../providers/token.provider';

export interface RegisterUseCaseParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterUseCaseResult {
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
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashProvider: HashProvider,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(params: RegisterUseCaseParams): Promise<RegisterUseCaseResult> {
    const existingUser = await this.userRepository.findByEmail(params.email);

    if (existingUser) {
      throw new EmailAlreadyInUse(params.email);
    }

    const hashedPassword = await this.hashProvider.hash(params.password);

    const user = await this.userRepository.create({
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      password: hashedPassword,
    });

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
