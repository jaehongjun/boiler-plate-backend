import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvestorService } from './investor.service';

@Controller('filters')
@UseGuards(JwtAuthGuard)
export class FiltersController {
  constructor(private readonly investorService: InvestorService) {}

  /**
   * GET /api/filters/periods
   * Get available periods (year/quarter combinations)
   */
  @Get('periods')
  async getAvailablePeriods() {
    const result = await this.investorService.getAvailablePeriods();
    return {
      success: true,
      data: result,
      message: 'Available periods retrieved successfully',
    };
  }

  /**
   * GET /api/filters/dictionaries
   * Get filter dictionaries (countries, types, etc.)
   */
  @Get('dictionaries')
  async getFilterDictionaries() {
    const result = await this.investorService.getFilterDictionaries();
    return {
      success: true,
      data: result,
      message: 'Filter dictionaries retrieved successfully',
    };
  }
}

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly investorService: InvestorService) {}

  /**
   * GET /api/metrics/summary
   * Get summary metrics for a period
   */
  @Get('summary')
  async getSummaryMetrics(
    @Query('year', ParseIntPipe) year: number,
    @Query('quarter', ParseIntPipe) quarter: number,
  ) {
    const result = await this.investorService.getSummaryMetrics(year, quarter);
    return {
      success: true,
      data: result,
      message: 'Summary metrics retrieved successfully',
    };
  }
}
