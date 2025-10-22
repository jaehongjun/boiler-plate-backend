import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { IrController } from './ir.controller';
import { IrService } from './ir.service';

@Module({
  imports: [DatabaseModule],
  controllers: [IrController],
  providers: [IrService],
  exports: [IrService],
})
export class IrModule {}
