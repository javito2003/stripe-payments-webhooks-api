import { Global, Module } from '@nestjs/common';
import { HashProvider } from './infrastructure/hash.provider';

@Global()
@Module({
  providers: [HashProvider],
  exports: [HashProvider],
})
export class SharedModule {}
