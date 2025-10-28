import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InvestorController } from './investor.controller';
import { FiltersController, MetricsController } from './filters.controller';
import { InvestorService } from './investor.service';

@Module({
  imports: [DatabaseModule],
  controllers: [InvestorController, FiltersController, MetricsController],
  providers: [InvestorService],
  exports: [InvestorService],
})
export class InvestorModule {}
