import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsNumber, Min } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: '고객명', example: '홍길동' })
  customerName: string;

  @ApiProperty({
    description: '주민번호',
    required: false,
    example: '123456-1234567',
  })
  residentNo?: string;

  @ApiProperty({
    description: '전화번호',
    required: false,
    example: '010-1234-5678',
  })
  phoneNo?: string;

  @ApiProperty({
    description: '이메일',
    required: false,
    example: 'hong@example.com',
  })
  email?: string;

  @ApiProperty({
    description: '주소',
    required: false,
    example: '서울시 강남구',
  })
  address?: string;

  @ApiProperty({
    description: '고객 등급',
    required: false,
    enum: ['VIP', 'GENERAL', 'POTENTIAL'],
    example: 'GENERAL',
  })
  customerGrade?: 'VIP' | 'GENERAL' | 'POTENTIAL';

  @ApiProperty({ description: '가입일', example: '2024-01-01' })
  joinDate: string;
}

export class UpdateCustomerDto {
  @ApiProperty({ description: '고객명', required: false, example: '홍길동' })
  customerName?: string;

  @ApiProperty({
    description: '주민번호',
    required: false,
    example: '123456-1234567',
  })
  residentNo?: string;

  @ApiProperty({
    description: '전화번호',
    required: false,
    example: '010-1234-5678',
  })
  phoneNo?: string;

  @ApiProperty({
    description: '이메일',
    required: false,
    example: 'hong@example.com',
  })
  email?: string;

  @ApiProperty({
    description: '주소',
    required: false,
    example: '서울시 강남구',
  })
  address?: string;

  @ApiProperty({
    description: '고객 등급',
    required: false,
    enum: ['VIP', 'GENERAL', 'POTENTIAL'],
    example: 'VIP',
  })
  customerGrade?: 'VIP' | 'GENERAL' | 'POTENTIAL';

  @ApiProperty({
    description: '마지막 연락일',
    required: false,
    example: '2024-01-01',
  })
  lastContactDate?: Date;

  @ApiProperty({
    description: '상태',
    required: false,
    enum: ['ACTIVE', 'INACTIVE'],
    example: 'ACTIVE',
  })
  status?: 'ACTIVE' | 'INACTIVE';
}

export class CreateContactHistoryDto {
  @ApiProperty({
    description: '연락 유형',
    required: false,
    enum: ['PHONE', 'VISIT', 'ONLINE', 'EMAIL'],
    example: 'PHONE',
  })
  contactType?: 'PHONE' | 'VISIT' | 'ONLINE' | 'EMAIL';

  @ApiProperty({
    description: '상담 목적',
    required: false,
    enum: ['INQUIRY', 'COMPLAINT', 'CONSULTATION', 'INVESTMENT_INQUIRY'],
    example: 'INQUIRY',
  })
  contactPurpose?:
    | 'INQUIRY'
    | 'COMPLAINT'
    | 'CONSULTATION'
    | 'INVESTMENT_INQUIRY';

  @ApiProperty({
    description: '상담 내용',
    required: false,
    example: '펀드 상품에 대한 문의',
  })
  contactNote?: string;

  @ApiProperty({ description: '담당자 ID', required: false, example: 1 })
  managerId?: number;
}

export class CreateAccountDto {
  @ApiProperty({ description: '계좌번호', example: '1234567890' })
  accountNo: string;

  @ApiProperty({
    description: '계좌 유형',
    required: false,
    enum: ['TRUST', 'PENSION', 'CMA'],
    example: 'TRUST',
  })
  accountType?: 'TRUST' | 'PENSION' | 'CMA';

  @ApiProperty({
    description: '개설일',
    required: false,
    example: '2024-01-01',
  })
  openDate?: string;

  @ApiProperty({ description: '잔액', required: false, example: '1000000' })
  balance?: string;
}

export class UpdateAccountDto {
  @ApiProperty({
    description: '계좌 유형',
    required: false,
    enum: ['TRUST', 'PENSION', 'CMA'],
    example: 'TRUST',
  })
  accountType?: 'TRUST' | 'PENSION' | 'CMA';

  @ApiProperty({
    description: '개설일',
    required: false,
    example: '2024-01-01',
  })
  openDate?: string;

  @ApiProperty({ description: '잔액', required: false, example: '1000000' })
  balance?: string;

  @ApiProperty({
    description: '상태',
    required: false,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    example: 'ACTIVE',
  })
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export class CreateProductDto {
  @ApiProperty({ description: '상품명', example: '삼성전자 주식' })
  productName: string;

  @ApiProperty({
    description: '상품 유형',
    required: false,
    enum: ['STOCK', 'BOND', 'FUND', 'ELS', 'ETF'],
    example: 'STOCK',
  })
  productType?: 'STOCK' | 'BOND' | 'FUND' | 'ELS' | 'ETF';

  @ApiProperty({
    description: '위험도',
    required: false,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    example: 'MEDIUM',
  })
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiProperty({ description: '발행사', required: false, example: '삼성전자' })
  issuer?: string;
}

export class UpdateProductDto {
  @ApiProperty({
    description: '상품명',
    required: false,
    example: '삼성전자 주식',
  })
  productName?: string;

  @ApiProperty({
    description: '상품 유형',
    required: false,
    enum: ['STOCK', 'BOND', 'FUND', 'ELS', 'ETF'],
    example: 'STOCK',
  })
  productType?: 'STOCK' | 'BOND' | 'FUND' | 'ELS' | 'ETF';

  @ApiProperty({
    description: '위험도',
    required: false,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    example: 'MEDIUM',
  })
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiProperty({ description: '발행사', required: false, example: '삼성전자' })
  issuer?: string;
}

export class CreateTransactionDto {
  @ApiProperty({ description: '계좌 ID', example: 1 })
  accountId: number;

  @ApiProperty({ description: '상품 ID', example: 1 })
  productId: number;

  @ApiProperty({
    description: '거래 유형',
    enum: ['BUY', 'SELL'],
    example: 'BUY',
  })
  tradeType: 'BUY' | 'SELL';

  @ApiProperty({ description: '거래 수량', example: '100' })
  tradeAmount: string;

  @ApiProperty({ description: '거래 가격', example: '50000' })
  tradePrice: string;
}

export class CustomerSearchParams {
  @ApiProperty({ description: '고객명', required: false, example: '홍길동' })
  customerName?: string;

  @ApiProperty({
    description: '고객 등급',
    required: false,
    enum: ['VIP', 'GENERAL', 'POTENTIAL'],
    example: 'VIP',
  })
  customerGrade?: 'VIP' | 'GENERAL' | 'POTENTIAL';

  @ApiProperty({
    description: '상태',
    required: false,
    enum: ['ACTIVE', 'INACTIVE'],
    example: 'ACTIVE',
  })
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({
    description: '가입일 시작',
    required: false,
    example: '2024-01-01',
  })
  joinDateFrom?: string;

  @ApiProperty({
    description: '가입일 종료',
    required: false,
    example: '2024-12-31',
  })
  joinDateTo?: string;

  @ApiProperty({ description: '페이지 번호', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value) || 1)
  page?: number;

  @ApiProperty({ description: '페이지 크기', required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 10)
  limit?: number;
}

export class TransactionSearchParams {
  @ApiProperty({ description: '계좌 ID', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  accountId?: number;

  @ApiProperty({ description: '상품 ID', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  productId?: number;

  @ApiProperty({
    description: '거래 유형',
    required: false,
    enum: ['BUY', 'SELL'],
    example: 'BUY',
  })
  tradeType?: 'BUY' | 'SELL';

  @ApiProperty({
    description: '거래일 시작',
    required: false,
    example: '2024-01-01',
  })
  tradeDateFrom?: Date;

  @ApiProperty({
    description: '거래일 종료',
    required: false,
    example: '2024-12-31',
  })
  tradeDateTo?: Date;

  @ApiProperty({ description: '페이지 번호', required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value) || 1)
  page?: number;

  @ApiProperty({ description: '페이지 크기', required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 10)
  limit?: number;
}
