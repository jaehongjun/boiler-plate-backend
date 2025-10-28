import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { InvestorService } from './investor.service';
import {
  queryInvestorsTableSchema,
  queryInvestorHistorySchema,
  queryTopInvestorsSchema,
  updateInvestorSchema,
  updateInvestorSnapshotSchema,
  QueryInvestorsTableDto,
  QueryInvestorHistoryDto,
  QueryTopInvestorsDto,
  UpdateInvestorDto,
  UpdateInvestorSnapshotDto,
} from './dto';

@Controller('investors')
@UseGuards(JwtAuthGuard)
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  /**
   * GET /api/investors/table
   * Get investors table view (grouped by parent/children)
   */
  @Get('table')
  async getInvestorsTable(
    @Query(new ZodValidationPipe(queryInvestorsTableSchema))
    query: QueryInvestorsTableDto,
  ) {
    const result = await this.investorService.getInvestorsTable(query);
    return {
      success: true,
      data: result,
      message: 'Investors table retrieved successfully',
    };
  }

  /**
   * GET /api/investors/top
   * Get top N investors by rank
   */
  @Get('top')
  async getTopInvestors(
    @Query(new ZodValidationPipe(queryTopInvestorsSchema))
    query: QueryTopInvestorsDto,
  ) {
    const result = await this.investorService.getTopInvestors(query);
    return {
      success: true,
      data: result,
      message: 'Top investors retrieved successfully',
    };
  }

  /**
   * GET /api/investors/:id
   * Get single investor detail with all related data (frontend-formatted)
   * Automatically fetches the latest quarter data
   */
  @Get(':id')
  async getInvestorDetail(@Param('id', ParseIntPipe) id: number) {
    const result = await this.investorService.getInvestorDetailForFrontend(id);
    return {
      success: true,
      data: result,
      message: 'Investor detail retrieved successfully',
    };
  }

  /**
   * GET /api/investors/:id/history
   * Get investor change history
   */
  @Get(':id/history')
  async getInvestorHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query(new ZodValidationPipe(queryInvestorHistorySchema))
    query: QueryInvestorHistoryDto,
  ) {
    const result = await this.investorService.getInvestorHistory(id, query);
    return {
      success: true,
      data: result,
      message: 'Investor history retrieved successfully',
    };
  }

  /**
   * PATCH /api/investors/:id
   * Update investor basic info
   */
  @Patch(':id')
  async updateInvestor(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateInvestorSchema))
    updateDto: UpdateInvestorDto,
    @CurrentUserId() userId: string,
  ) {
    const result = await this.investorService.updateInvestor(
      id,
      updateDto,
      userId,
    );
    return {
      success: true,
      data: result,
      message: 'Investor updated successfully',
    };
  }

  /**
   * PATCH /api/investors/:id/snapshot
   * Update investor snapshot (creates history record)
   */
  @Patch(':id/snapshot')
  async updateInvestorSnapshot(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateInvestorSnapshotSchema))
    updateDto: UpdateInvestorSnapshotDto,
    @CurrentUserId() userId: string,
  ) {
    const result = await this.investorService.updateInvestorSnapshot(
      id,
      updateDto,
      userId,
    );
    return {
      success: true,
      data: result,
      message: 'Investor snapshot updated successfully',
    };
  }
}
