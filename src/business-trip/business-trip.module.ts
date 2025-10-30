import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BusinessTripController } from './business-trip.controller';
import { BusinessTripService } from './business-trip.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BusinessTripController],
  providers: [BusinessTripService],
  exports: [BusinessTripService],
})
export class BusinessTripModule {}
