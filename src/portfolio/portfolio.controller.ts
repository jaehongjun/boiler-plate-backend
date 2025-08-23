import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioExceptionFilter } from './filters/portfolio-exception.filter';
import {
  PortfolioData,
  Performance,
  PortfolioAsset,
  AssetAllocation,
  PaginatedResponse,
  Transaction,
  ApiResponse,
} from './types/portfolio.types';

@Controller('portfolio')
@UseFilters(PortfolioExceptionFilter)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':accountId')
  getPortfolioData(
    @Param('accountId') accountId: string,
  ): ApiResponse<PortfolioData> {
    try {
      const data = this.portfolioService.getPortfolioData(accountId);
      return {
        data,
        message: '포트폴리오 데이터를 성공적으로 조회했습니다.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '포트폴리오 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':accountId/performance')
  getPortfolioPerformance(
    @Param('accountId') accountId: string,
    @Query('period') period?: string,
  ): ApiResponse<Performance[]> {
    try {
      const data = this.portfolioService.getPortfolioPerformance(
        accountId,
        period,
      );
      return {
        data,
        message: '포트폴리오 성과 데이터를 성공적으로 조회했습니다.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '포트폴리오 성과 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':accountId/assets')
  getPortfolioAssets(
    @Param('accountId') accountId: string,
  ): ApiResponse<PortfolioAsset[]> {
    try {
      const data = this.portfolioService.getPortfolioAssets(accountId);
      return {
        data,
        message: '포트폴리오 자산 데이터를 성공적으로 조회했습니다.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '포트폴리오 자산 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':accountId/allocation')
  getPortfolioAllocation(
    @Param('accountId') accountId: string,
  ): ApiResponse<AssetAllocation[]> {
    try {
      const data = this.portfolioService.getPortfolioAllocation(accountId);
      return {
        data,
        message: '포트폴리오 할당 데이터를 성공적으로 조회했습니다.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '포트폴리오 할당 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':accountId/transactions')
  getPortfolioTransactions(
    @Param('accountId') accountId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): ApiResponse<PaginatedResponse<Transaction>> {
    try {
      const data = this.portfolioService.getPortfolioTransactions(
        accountId,
        limit,
      );
      return {
        data,
        message: '포트폴리오 거래 내역을 성공적으로 조회했습니다.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '포트폴리오 거래 내역 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
