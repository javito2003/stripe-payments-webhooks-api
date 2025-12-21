import { ConflictException, UnauthorizedException } from '@nestjs/common';

export class EmailAlreadyInUse extends ConflictException {
  constructor(email: string) {
    super(`The email address ${email} is already in use.`);
  }
}

export class InvalidCredentials extends UnauthorizedException {
  constructor() {
    super('Invalid credentials');
  }
}
