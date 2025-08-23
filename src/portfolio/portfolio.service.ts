import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PortfolioData,
  Performance,
  PortfolioAsset,
  AssetAllocation,
  Transaction,
  PaginatedResponse,
} from './types/portfolio.types';
import {
  generateMockPortfolioData,
  mockPerformance,
  mockAssets,
  mockAllocation,
  mockTransactions,
} from './data/mock-data';

@Injectable()
export class PortfolioService {
  getPortfolioData(accountId: string): PortfolioData {
    try {
      return generateMockPortfolioData(accountId);
    } catch {
      throw new NotFoundException('포트폴리오를 찾을 수 없습니다.');
    }
  }

  getPortfolioPerformance(accountId: string, period?: string): Performance[] {
    const performance = mockPerformance[accountId];
    if (!performance) {
      throw new NotFoundException('포트폴리오를 찾을 수 없습니다.');
    }

    if (period) {
      return performance.filter((p) => p.period === period);
    }

    return performance;
  }

  getPortfolioAssets(accountId: string): PortfolioAsset[] {
    const assets = mockAssets[accountId];
    if (!assets) {
      throw new NotFoundException('포트폴리오를 찾을 수 없습니다.');
    }

    return assets;
  }

  getPortfolioAllocation(accountId: string): AssetAllocation[] {
    const allocation = mockAllocation[accountId];
    if (!allocation) {
      throw new NotFoundException('포트폴리오를 찾을 수 없습니다.');
    }

    return allocation;
  }

  getPortfolioTransactions(
    accountId: string,
    limit: number = 10,
  ): PaginatedResponse<Transaction> {
    const transactions = mockTransactions[accountId];
    if (!transactions) {
      throw new NotFoundException('포트폴리오를 찾을 수 없습니다.');
    }

    const limitedTransactions = transactions.slice(0, limit);

    return {
      data: limitedTransactions,
      pagination: {
        page: 1,
        limit,
        total: transactions.length,
        totalPages: Math.ceil(transactions.length / limit),
      },
    };
  }

  validateAccountId(accountId: string): boolean {
    return Object.keys(mockPerformance).includes(accountId);
  }
}
