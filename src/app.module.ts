import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { IrModule } from './ir/ir.module';
import { InvestorModule } from './investor/investor.module';
import { BusinessTripModule } from './business-trip/business-trip.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1분
        limit: 100, // 요청 100개까지
      },
    ]),
    DatabaseModule,
    AuthModule,
    FilesModule,
    IrModule,
    InvestorModule,
    BusinessTripModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
