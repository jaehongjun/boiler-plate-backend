import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { CrmModule } from './crm/crm.module';
import { CalendarModule } from './calendar/calendar.module';
import { FilesModule } from './files/files.module';
import { IrModule } from './ir/ir.module';

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
    PortfolioModule,
    CrmModule,
    CalendarModule,
    FilesModule,
    IrModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
