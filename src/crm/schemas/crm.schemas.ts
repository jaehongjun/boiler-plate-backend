import { z } from 'zod';

// 고객 생성 스키마
export const CreateCustomerSchema = z.object({
  customerName: z
    .string()
    .min(1, '고객명은 필수입니다.')
    .max(100, '고객명이 너무 깁니다.'),
  residentNo: z.string().optional(),
  phoneNo: z.string().optional(),
  email: z.string().email('올바른 이메일 형식이 아닙니다.').optional(),
  address: z.string().max(200, '주소가 너무 깁니다.').optional(),
  customerGrade: z.enum(['VIP', '일반', '잠재고객']).optional(),
  joinDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// 고객 수정 스키마
export const UpdateCustomerSchema = z.object({
  customerName: z.string().min(1).max(100).optional(),
  residentNo: z.string().optional(),
  phoneNo: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().max(200).optional(),
  customerGrade: z.enum(['VIP', '일반', '잠재고객']).optional(),
  lastContactDate: z.date().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// 상담 이력 생성 스키마
export const CreateContactHistorySchema = z.object({
  contactType: z.enum(['전화', '방문', '온라인', '이메일']).optional(),
  contactPurpose: z.string().max(100, '상담 목적이 너무 깁니다.').optional(),
  contactNote: z.string().optional(),
  managerId: z.number().optional(),
});

// 계좌 생성 스키마
export const CreateAccountSchema = z.object({
  accountNo: z
    .string()
    .min(1, '계좌번호는 필수입니다.')
    .max(30, '계좌번호가 너무 깁니다.'),
  accountType: z.enum(['위탁계좌', '연금계좌', 'CMA']).optional(),
  openDate: z.string().optional(),
  balance: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// 계좌 수정 스키마
export const UpdateAccountSchema = z.object({
  accountType: z.enum(['위탁계좌', '연금계좌', 'CMA']).optional(),
  openDate: z.string().optional(),
  balance: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// 상품 생성 스키마
export const CreateProductSchema = z.object({
  productName: z
    .string()
    .min(1, '상품명은 필수입니다.')
    .max(100, '상품명이 너무 깁니다.'),
  productType: z.enum(['주식', '채권', '펀드', 'ELS']).optional(),
  riskLevel: z.enum(['고위험', '중위험', '저위험']).optional(),
  issuer: z.string().max(100, '발행사명이 너무 깁니다.').optional(),
});

// 상품 수정 스키마
export const UpdateProductSchema = z.object({
  productName: z.string().min(1).max(100).optional(),
  productType: z.enum(['주식', '채권', '펀드', 'ELS']).optional(),
  riskLevel: z.enum(['고위험', '중위험', '저위험']).optional(),
  issuer: z.string().max(100).optional(),
});

// 거래 생성 스키마
export const CreateTransactionSchema = z.object({
  accountId: z.number().min(1, '계좌 ID는 필수입니다.'),
  productId: z.number().min(1, '상품 ID는 필수입니다.'),
  tradeType: z.enum(['BUY', 'SELL']),
  tradeAmount: z.string().optional(),
  tradePrice: z.string().optional(),
});

// 검색 파라미터 스키마
export const CustomerSearchSchema = z.object({
  customerName: z.string().optional(),
  customerGrade: z.enum(['VIP', '일반', '잠재고객']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  joinDateFrom: z.string().optional(),
  joinDateTo: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const TransactionSearchSchema = z.object({
  accountId: z.number().optional(),
  productId: z.number().optional(),
  tradeType: z.enum(['BUY', 'SELL']).optional(),
  tradeDateFrom: z.string().optional(),
  tradeDateTo: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});
