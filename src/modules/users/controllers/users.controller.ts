import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { GetUserByIdUseCase } from '../use-cases/get-user-by-id.use-case';

@Controller('users')
export class UsersController {
  constructor(private readonly getUserByIdUseCase: GetUserByIdUseCase) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.getUserByIdUseCase.execute(userId);
  }
}
