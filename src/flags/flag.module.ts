import { Module } from '@nestjs/common';
import { FlagController } from './flag.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FlagController],
})
export class FlagModule {}
