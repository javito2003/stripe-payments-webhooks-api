import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/users.repository';
import { UserNotFoundError } from '../users.errors';

@Injectable()
export class GetUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return user;
  }
}
