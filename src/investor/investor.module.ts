import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InvestorController } from './investor.controller';
import { FiltersController, MetricsController } from './filters.controller';
import { GidController } from './gid.controller';
import { InvestorService } from './investor.service';
import { GidService } from './gid.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    InvestorController,
    FiltersController,
    MetricsController,
    GidController,
  ],
  providers: [InvestorService, GidService],
  exports: [InvestorService, GidService],
})
export class InvestorModule {}
