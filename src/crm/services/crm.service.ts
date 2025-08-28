import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, like, gte, lte, desc, asc, count, sum } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../../database/database.module';
import {
  customers,
  contactHistory,
  accounts,
  products,
  transactions,
} from '../../database/schemas/crm.schema';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateContactHistoryDto,
  CreateAccountDto,
  UpdateAccountDto,
  CreateProductDto,
  UpdateProductDto,
  CreateTransactionDto,
  CustomerSearchParams,
  TransactionSearchParams,
  Customer,
  ContactHistory,
  Account,
  Product,
  Transaction,
  PaginatedResponse,
} from '../types/crm.types';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: PostgresJsDatabase<any>,
  ) {}

  // ==================== 고객 관리 ====================

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    this.logger.log(`고객 생성 시작: ${createCustomerDto.customerName}`);

    try {
      const { customerId, ...insertData } = createCustomerDto as any;
      const [customer] = await this.db
        .insert(customers)
        .values(insertData)
        .returning();

      this.logger.log(`고객 생성 완료: ID ${customer.customerId}`);
      return customer;
    } catch (error) {
      this.logger.error(`고객 생성 실패: ${error.message}`);
      throw error;
    }
  }

  async getCustomers(
    filters: CustomerSearchParams,
  ): Promise<PaginatedResponse<Customer>> {
    this.logger.log(`고객 목록 조회 시작: ${JSON.stringify(filters)}`);

    try {
      const whereConditions: any[] = [];

      if (filters.customerName) {
        whereConditions.push(
          like(customers.customerName, `%${filters.customerName}%`),
        );
      }

      if (filters.customerGrade) {
        whereConditions.push(
          eq(customers.customerGrade, filters.customerGrade),
        );
      }

      if (filters.status) {
        whereConditions.push(eq(customers.status, filters.status));
      }

      if (filters.joinDateFrom) {
        whereConditions.push(gte(customers.joinDate, filters.joinDateFrom));
      }

      if (filters.joinDateTo) {
        whereConditions.push(lte(customers.joinDate, filters.joinDateTo));
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const [totalResult] = await this.db
        .select({ count: count() })
        .from(customers)
        .where(
          whereConditions.length > 0 ? and(...whereConditions) : undefined,
        );

      const total = totalResult.count;

      const customersList = await this.db
        .select()
        .from(customers)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(customers.regDate))
        .limit(limit)
        .offset(offset);

      const result = {
        data: customersList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      this.logger.log(`고객 목록 조회 완료: 총 ${total}건, 페이지 ${page}`);
      return result;
    } catch (error) {
      this.logger.error(`고객 목록 조회 실패: ${error.message}`);
      throw error;
    }
  }

  async getCustomerById(id: number): Promise<Customer> {
    this.logger.log(`고객 조회 시작: ID ${id}`);

    try {
      const [customer] = await this.db
        .select()
        .from(customers)
        .where(eq(customers.customerId, id));

      if (!customer) {
        this.logger.warn(`고객을 찾을 수 없음: ID ${id}`);
        throw new Error('고객을 찾을 수 없습니다.');
      }

      this.logger.log(`고객 조회 완료: ID ${id}`);
      return customer;
    } catch (error) {
      this.logger.error(`고객 조회 실패: ID ${id}, ${error.message}`);
      throw error;
    }
  }

  async updateCustomer(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    this.logger.log(`고객 정보 업데이트 시작: ID ${id}`);

    try {
      const updateData = {
        ...updateCustomerDto,
        lastContactDate: new Date(),
      };

      const [customer] = await this.db
        .update(customers)
        .set(updateData)
        .where(eq(customers.customerId, id))
        .returning();

      if (!customer) {
        this.logger.warn(`업데이트할 고객을 찾을 수 없음: ID ${id}`);
        throw new Error('고객을 찾을 수 없습니다.');
      }

      this.logger.log(`고객 정보 업데이트 완료: ID ${id}`);
      return customer;
    } catch (error) {
      this.logger.error(`고객 정보 업데이트 실패: ID ${id}, ${error.message}`);
      throw error;
    }
  }

  async deleteCustomer(id: number): Promise<void> {
    this.logger.log(`고객 삭제 시작: ID ${id}`);

    try {
      const result = await this.db
        .delete(customers)
        .where(eq(customers.customerId, id));

      if (result.length === 0) {
        this.logger.warn(`삭제할 고객을 찾을 수 없음: ID ${id}`);
        throw new Error('고객을 찾을 수 없습니다.');
      }

      this.logger.log(`고객 삭제 완료: ID ${id}`);
    } catch (error) {
      this.logger.error(`고객 삭제 실패: ID ${id}, ${error.message}`);
      throw error;
    }
  }

  // ==================== 상담/문의 이력 관리 ====================

  async createContactHistory(
    createContactHistoryDto: CreateContactHistoryDto,
  ): Promise<ContactHistory> {
    this.logger.log(
      `상담 이력 생성 시작: 고객 ID ${createContactHistoryDto.customerId}`,
    );

    try {
      const { contactId, ...insertData } = createContactHistoryDto as any;
      const [contact] = await this.db
        .insert(contactHistory)
        .values(insertData)
        .returning();

      this.logger.log(`상담 이력 생성 완료: ID ${contact.contactId}`);
      return contact;
    } catch (error) {
      this.logger.error(`상담 이력 생성 실패: ${error.message}`);
      throw error;
    }
  }

  async getContactHistoryByCustomerId(
    customerId: number,
  ): Promise<ContactHistory[]> {
    this.logger.log(`상담 이력 조회 시작: 고객 ID ${customerId}`);

    try {
      const contacts = await this.db
        .select()
        .from(contactHistory)
        .where(eq(contactHistory.customerId, customerId))
        .orderBy(desc(contactHistory.contactDate));

      this.logger.log(
        `상담 이력 조회 완료: 고객 ID ${customerId}, ${contacts.length}건`,
      );
      return contacts;
    } catch (error) {
      this.logger.error(
        `상담 이력 조회 실패: 고객 ID ${customerId}, ${error.message}`,
      );
      throw error;
    }
  }

  // ==================== 투자계좌 관리 ====================

  async createAccount(createAccountDto: CreateAccountDto): Promise<Account> {
    this.logger.log(`계좌 생성 시작: 계좌번호 ${createAccountDto.accountNo}`);

    try {
      const { accountId, ...insertData } = createAccountDto as any;
      const [account] = await this.db
        .insert(accounts)
        .values(insertData)
        .returning();

      this.logger.log(`계좌 생성 완료: ID ${account.accountId}`);
      return account;
    } catch (error) {
      this.logger.error(`계좌 생성 실패: ${error.message}`);
      throw error;
    }
  }

  async getAccountsByCustomerId(customerId: number): Promise<Account[]> {
    this.logger.log(`계좌 목록 조회 시작: 고객 ID ${customerId}`);

    try {
      const accountsList = await this.db
        .select()
        .from(accounts)
        .where(eq(accounts.customerId, customerId))
        .orderBy(desc(accounts.openDate));

      this.logger.log(
        `계좌 목록 조회 완료: 고객 ID ${customerId}, ${accountsList.length}건`,
      );
      return accountsList;
    } catch (error) {
      this.logger.error(
        `계좌 목록 조회 실패: 고객 ID ${customerId}, ${error.message}`,
      );
      throw error;
    }
  }

  async updateAccount(
    id: number,
    updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    this.logger.log(`계좌 정보 업데이트 시작: ID ${id}`);

    try {
      const [account] = await this.db
        .update(accounts)
        .set(updateAccountDto)
        .where(eq(accounts.accountId, id))
        .returning();

      if (!account) {
        this.logger.warn(`업데이트할 계좌를 찾을 수 없음: ID ${id}`);
        throw new Error('계좌를 찾을 수 없습니다.');
      }

      this.logger.log(`계좌 정보 업데이트 완료: ID ${id}`);
      return account;
    } catch (error) {
      this.logger.error(`계좌 정보 업데이트 실패: ID ${id}, ${error.message}`);
      throw error;
    }
  }

  // ==================== 투자상품 관리 ====================

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    this.logger.log(`상품 생성 시작: ${createProductDto.productName}`);

    try {
      const { productId, ...insertData } = createProductDto as any;
      const [product] = await this.db
        .insert(products)
        .values(insertData)
        .returning();

      this.logger.log(`상품 생성 완료: ID ${product.productId}`);
      return product;
    } catch (error) {
      this.logger.error(`상품 생성 실패: ${error.message}`);
      throw error;
    }
  }

  async getProducts(): Promise<Product[]> {
    this.logger.log('상품 목록 조회 시작');

    try {
      const productsList = await this.db
        .select()
        .from(products)
        .orderBy(asc(products.productName));

      this.logger.log(`상품 목록 조회 완료: ${productsList.length}건`);
      return productsList;
    } catch (error) {
      this.logger.error(`상품 목록 조회 실패: ${error.message}`);
      throw error;
    }
  }

  async getProductById(id: number): Promise<Product> {
    this.logger.log(`상품 조회 시작: ID ${id}`);

    try {
      const [product] = await this.db
        .select()
        .from(products)
        .where(eq(products.productId, id));

      if (!product) {
        this.logger.warn(`상품을 찾을 수 없음: ID ${id}`);
        throw new Error('상품을 찾을 수 없습니다.');
      }

      this.logger.log(`상품 조회 완료: ID ${id}`);
      return product;
    } catch (error) {
      this.logger.error(`상품 조회 실패: ID ${id}, ${error.message}`);
      throw error;
    }
  }

  async updateProduct(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    this.logger.log(`상품 정보 업데이트 시작: ID ${id}`);

    try {
      const [product] = await this.db
        .update(products)
        .set(updateProductDto)
        .where(eq(products.productId, id))
        .returning();

      if (!product) {
        this.logger.warn(`업데이트할 상품을 찾을 수 없음: ID ${id}`);
        throw new Error('상품을 찾을 수 없습니다.');
      }

      this.logger.log(`상품 정보 업데이트 완료: ID ${id}`);
      return product;
    } catch (error) {
      this.logger.error(`상품 정보 업데이트 실패: ID ${id}, ${error.message}`);
      throw error;
    }
  }

  // ==================== 거래내역 관리 ====================

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    this.logger.log(
      `거래 생성 시작: 계좌 ID ${createTransactionDto.accountId}, 상품 ID ${createTransactionDto.productId}`,
    );

    try {
      const { transactionId, ...insertData } = createTransactionDto as any;
      const [transaction] = await this.db
        .insert(transactions)
        .values(insertData)
        .returning();

      // 계좌 잔액 업데이트
      if (createTransactionDto.tradeAmount && createTransactionDto.tradePrice) {
        const balanceChange =
          createTransactionDto.tradeType === 'BUY'
            ? `-${createTransactionDto.tradeAmount}`
            : createTransactionDto.tradeAmount;

        await this.db
          .update(accounts)
          .set({ balance: balanceChange })
          .where(eq(accounts.accountId, createTransactionDto.accountId));
      }

      this.logger.log(`거래 생성 완료: ID ${transaction.transactionId}`);
      return transaction;
    } catch (error) {
      this.logger.error(`거래 생성 실패: ${error.message}`);
      throw error;
    }
  }

  async getTransactions(
    filters: TransactionSearchParams,
  ): Promise<PaginatedResponse<Transaction>> {
    this.logger.log(`거래내역 조회 시작: ${JSON.stringify(filters)}`);

    try {
      const whereConditions: any[] = [];

      if (filters.accountId) {
        whereConditions.push(eq(transactions.accountId, filters.accountId));
      }

      if (filters.productId) {
        whereConditions.push(eq(transactions.productId, filters.productId));
      }

      if (filters.tradeType) {
        whereConditions.push(eq(transactions.tradeType, filters.tradeType));
      }

      if (filters.tradeDateFrom) {
        whereConditions.push(
          gte(transactions.tradeDate, filters.tradeDateFrom),
        );
      }

      if (filters.tradeDateTo) {
        whereConditions.push(lte(transactions.tradeDate, filters.tradeDateTo));
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const [totalResult] = await this.db
        .select({ count: count() })
        .from(transactions)
        .where(
          whereConditions.length > 0 ? and(...whereConditions) : undefined,
        );

      const total = totalResult.count;

      const transactionsList = await this.db
        .select()
        .from(transactions)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(transactions.tradeDate))
        .limit(limit)
        .offset(offset);

      const result = {
        data: transactionsList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      this.logger.log(`거래내역 조회 완료: 총 ${total}건, 페이지 ${page}`);
      return result;
    } catch (error) {
      this.logger.error(`거래내역 조회 실패: ${error.message}`);
      throw error;
    }
  }

  // ==================== 통계 ====================

  async getCustomerStatistics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    vipCustomers: number;
    newCustomersThisMonth: number;
  }> {
    this.logger.log('고객 통계 조회 시작');

    try {
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();

      const [totalResult] = await this.db
        .select({ count: count() })
        .from(customers);

      const [activeResult] = await this.db
        .select({ count: count() })
        .from(customers)
        .where(eq(customers.status, 'ACTIVE'));

      const [vipResult] = await this.db
        .select({ count: count() })
        .from(customers)
        .where(eq(customers.customerGrade, 'VIP'));

      const [newCustomersResult] = await this.db
        .select({ count: count() })
        .from(customers)
        .where(gte(customers.joinDate, startOfMonth));

      const statistics = {
        totalCustomers: totalResult.count,
        activeCustomers: activeResult.count,
        vipCustomers: vipResult.count,
        newCustomersThisMonth: newCustomersResult.count,
      };

      this.logger.log(`고객 통계 조회 완료: 총 ${statistics.totalCustomers}건`);
      return statistics;
    } catch (error) {
      this.logger.error(`고객 통계 조회 실패: ${error.message}`);
      throw error;
    }
  }

  async getTransactionStatistics(): Promise<{
    totalTransactions: number;
    totalVolume: number;
    buyTransactions: number;
    sellTransactions: number;
  }> {
    this.logger.log('거래 통계 조회 시작');

    try {
      const [totalResult] = await this.db
        .select({ count: count() })
        .from(transactions);

      const [volumeResult] = await this.db
        .select({ sum: sum(transactions.tradePrice) })
        .from(transactions);

      const [buyResult] = await this.db
        .select({ count: count() })
        .from(transactions)
        .where(eq(transactions.tradeType, 'BUY'));

      const [sellResult] = await this.db
        .select({ count: count() })
        .from(transactions)
        .where(eq(transactions.tradeType, 'SELL'));

      const statistics = {
        totalTransactions: totalResult.count,
        totalVolume: Number(volumeResult.sum) || 0,
        buyTransactions: buyResult.count,
        sellTransactions: sellResult.count,
      };

      this.logger.log(
        `거래 통계 조회 완료: 총 ${statistics.totalTransactions}건`,
      );
      return statistics;
    } catch (error) {
      this.logger.error(`거래 통계 조회 실패: ${error.message}`);
      throw error;
    }
  }
}
