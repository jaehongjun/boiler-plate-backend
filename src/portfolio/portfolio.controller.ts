import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { PortfolioExceptionFilter } from './filters/portfolio-exception.filter';
import {
  PortfolioData,
  Performance,
  PortfolioAsset,
  AssetAllocation,
  PaginatedResponse,
  Transaction,
  ApiResponse as PortfolioApiResponse,
} from './types/portfolio.types';

@Controller('portfolio')
@UseFilters(PortfolioExceptionFilter)
@ApiTags('포트폴리오')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':accountId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '포트폴리오 데이터 조회',
    description: '계좌별 포트폴리오 데이터를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '포트폴리오 데이터 조회 성공',
  })
  getPortfolioData(
    @Param('accountId') accountId: string,
  ): PortfolioApiResponse<PortfolioData> {
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

  @UseGuards(JwtAuthGuard)
  @Get(':accountId/performance')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '포트폴리오 성과 조회',
    description: '포트폴리오 성과 데이터를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '포트폴리오 성과 조회 성공',
  })
  getPortfolioPerformance(
    @Param('accountId') accountId: string,
    @Query('period') period?: string,
  ): PortfolioApiResponse<Performance[]> {
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

  @UseGuards(JwtAuthGuard)
  @Get(':accountId/assets')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '포트폴리오 자산 조회',
    description: '포트폴리오 자산 데이터를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '포트폴리오 자산 조회 성공',
  })
  getPortfolioAssets(
    @Param('accountId') accountId: string,
  ): PortfolioApiResponse<PortfolioAsset[]> {
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

  @UseGuards(JwtAuthGuard)
  @Get(':accountId/allocation')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '포트폴리오 할당 조회',
    description: '포트폴리오 할당 데이터를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '포트폴리오 할당 조회 성공',
  })
  getPortfolioAllocation(
    @Param('accountId') accountId: string,
  ): PortfolioApiResponse<AssetAllocation[]> {
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

  @UseGuards(JwtAuthGuard)
  @Get(':accountId/transactions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '포트폴리오 거래내역 조회',
    description: '포트폴리오 거래내역을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '포트폴리오 거래내역 조회 성공',
  })
  getPortfolioTransactions(
    @Param('accountId') accountId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): PortfolioApiResponse<PaginatedResponse<Transaction>> {
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
