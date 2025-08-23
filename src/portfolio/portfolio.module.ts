import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioExceptionFilter } from './filters/portfolio-exception.filter';

@Module({
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    {
      provide: APP_FILTER,
      useClass: PortfolioExceptionFilter,
    },
  ],
  exports: [PortfolioService],
})
export class PortfolioModule {}
