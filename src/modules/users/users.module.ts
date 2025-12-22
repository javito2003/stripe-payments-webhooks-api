import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserRepository } from './repository/users.repository';
import { GetUserByIdUseCase } from './use-cases/get-user-by-id.use-case';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UserRepository, GetUserByIdUseCase],
  exports: [UserRepository],
})
export class UsersModule {}
