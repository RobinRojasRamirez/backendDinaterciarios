import { Module } from '@nestjs/common';
import { RecordsController } from './controllers/records.controller';
import { RecordsService } from './services/records.service';

@Module({
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
