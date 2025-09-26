// 고객 관련 타입
export interface Customer {
  customerId: number;
  customerName: string;
  residentNo: string | null;
  phoneNo: string | null;
  email: string | null;
  address: string | null;
  customerGrade: 'VIP' | 'GENERAL' | 'POTENTIAL' | null;
  joinDate: string;
  lastContactDate: Date | null;
  status: 'ACTIVE' | 'INACTIVE' | null;
  regDate: Date | null;
}

export interface CreateCustomerDto {
  customerName: string;
  residentNo?: string;
  phoneNo?: string;
  email?: string;
  address?: string;
  customerGrade?: 'VIP' | 'GENERAL' | 'POTENTIAL';
  joinDate: string;
}

export interface UpdateCustomerDto {
  customerName?: string;
  residentNo?: string;
  phoneNo?: string;
  email?: string;
  address?: string;
  customerGrade?: 'VIP' | 'GENERAL' | 'POTENTIAL';
  lastContactDate?: Date;
  status?: 'ACTIVE' | 'INACTIVE';
}

// 상담/문의 이력 관련 타입
export interface ContactHistory {
  contactId: number;
  customerId: number;
  contactType: 'PHONE' | 'VISIT' | 'ONLINE' | 'EMAIL' | null;
  contactPurpose?:
    | 'INQUIRY'
    | 'COMPLAINT'
    | 'CONSULTATION'
    | 'INVESTMENT_INQUIRY'
    | null;
  contactNote: string | null;
  contactDate: Date | null;
  managerId: number | null;
}

export interface CreateContactHistoryDto {
  customerId: number;
  contactType?: 'PHONE' | 'VISIT' | 'ONLINE' | 'EMAIL';
  contactPurpose?:
    | 'INQUIRY'
    | 'COMPLAINT'
    | 'CONSULTATION'
    | 'INVESTMENT_INQUIRY';
  contactNote?: string;
  managerId?: number;
}

// 투자계좌 관련 타입
export interface Account {
  accountId: number;
  customerId: number;
  accountNo: string;
  accountType: 'TRUST' | 'PENSION' | 'CMA' | null;
  openDate: string | null;
  balance: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null;
}

export interface CreateAccountDto {
  customerId: number;
  accountNo: string;
  accountType?: 'TRUST' | 'PENSION' | 'CMA';
  openDate?: string;
  balance?: string;
}

export interface UpdateAccountDto {
  accountType?: 'TRUST' | 'PENSION' | 'CMA';
  balance?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// 투자상품 관련 타입
export interface Product {
  productId: number;
  productName: string;
  productType: 'STOCK' | 'BOND' | 'FUND' | 'ELS' | 'ETF' | null;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  issuer: string | null;
  regDate: Date | null;
}

export interface CreateProductDto {
  productName: string;
  productType?: 'STOCK' | 'BOND' | 'FUND' | 'ELS' | 'ETF';
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  issuer?: string;
}

export interface UpdateProductDto {
  productName?: string;
  productType?: 'STOCK' | 'BOND' | 'FUND' | 'ELS' | 'ETF';
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  issuer?: string;
}

// 거래내역 관련 타입
export interface Transaction {
  transactionId: number;
  accountId: number;
  productId: number;
  tradeType: 'BUY' | 'SELL' | null;
  tradeAmount: string | null;
  tradePrice: string | null;
  tradeDate: Date | null;
}

export interface CreateTransactionDto {
  accountId: number;
  productId: number;
  tradeType: 'BUY' | 'SELL';
  tradeAmount: string;
  tradePrice: string;
}

// API 응답 타입
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T | undefined;
  status?: 'SUCCESS' | 'ERROR';
  message?: string;
  pagination?: Pagination;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// 검색 및 필터링 타입
export interface CustomerSearchParams {
  customerName?: string;
  customerGrade?: 'VIP' | 'GENERAL' | 'POTENTIAL';
  status?: 'ACTIVE' | 'INACTIVE';
  joinDateFrom?: string;
  joinDateTo?: string;
  page?: number;
  limit?: number;
}

export interface TransactionSearchParams {
  accountId?: number;
  productId?: number;
  tradeType?: 'BUY' | 'SELL';
  tradeDateFrom?: Date;
  tradeDateTo?: Date;
  page?: number;
  limit?: number;
}
