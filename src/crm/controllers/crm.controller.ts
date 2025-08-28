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
} from '../dto/crm.dto';
import {
  ApiResponse as CrmApiResponse,
  PaginatedResponse,
  Customer,
  ContactHistory,
  Account,
  Product,
  Transaction,
} from '../types/crm.types';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CrmExceptionFilter } from '../filters/crm-exception.filter';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseFilters,
  ValidationPipe,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CrmService } from '../services/crm.service';

@Controller('crm')
@UseGuards(JwtAuthGuard)
@UseFilters(CrmExceptionFilter)
@ApiTags('CRM')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ==================== 고객 관리 API ====================

  @Post('customers')
  @ApiOperation({
    summary: '고객 생성',
    description: '새로운 고객을 생성합니다.',
  })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({
    status: 201,
    description: '고객 생성 성공',
  })
  @ApiBearerAuth('JWT-auth')
  async createCustomer(
    @Body(ValidationPipe) createCustomerDto: CreateCustomerDto,
  ): Promise<CrmApiResponse<Customer>> {
    try {
      const customer = await this.crmService.createCustomer(createCustomerDto);
      return {
        data: customer,
        message: '고객이 성공적으로 생성되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || '고객 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('customers')
  async getCustomers(
    @Query() query: CustomerSearchParams,
  ): Promise<CrmApiResponse<PaginatedResponse<Customer>>> {
    try {
      const customers = await this.crmService.getCustomers(query);
      return {
        data: customers,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '고객 목록 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('customers/:id')
  async getCustomerById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CrmApiResponse<Customer>> {
    try {
      const customer = await this.crmService.getCustomerById(id);
      return {
        data: customer,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '고객 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('customers/:id')
  async updateCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateCustomerDto: UpdateCustomerDto,
  ): Promise<CrmApiResponse<Customer>> {
    try {
      const customer = await this.crmService.updateCustomer(
        id,
        updateCustomerDto,
      );
      return {
        data: customer,
        message: '고객 정보가 성공적으로 업데이트되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || '고객 정보 업데이트 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('customers/:id')
  async deleteCustomer(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CrmApiResponse<void>> {
    try {
      await this.crmService.deleteCustomer(id);
      return {
        data: null as any,
        message: '고객이 성공적으로 삭제되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || '고객 삭제 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 상담/문의 이력 API ====================

  @Post('customers/:customerId/contacts')
  async createContactHistory(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Body(ValidationPipe) createContactHistoryDto: CreateContactHistoryDto,
  ): Promise<CrmApiResponse<ContactHistory>> {
    try {
      const contact = await this.crmService.createContactHistory({
        ...createContactHistoryDto,
        customerId,
      });
      return {
        data: contact,
        message: '상담 이력이 성공적으로 생성되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || '상담 이력 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('customers/:customerId/contacts')
  async getContactHistoryByCustomerId(
    @Param('customerId', ParseIntPipe) customerId: number,
  ): Promise<CrmApiResponse<ContactHistory[]>> {
    try {
      const contacts =
        await this.crmService.getContactHistoryByCustomerId(customerId);
      return {
        data: contacts,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '상담 이력 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 투자계좌 API ====================

  @Post('customers/:customerId/accounts')
  async createAccount(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Body(ValidationPipe) createAccountDto: CreateAccountDto,
  ): Promise<CrmApiResponse<Account>> {
    try {
      const account = await this.crmService.createAccount({
        ...createAccountDto,
        customerId,
      });
      return {
        data: account,
        message: '계좌가 성공적으로 생성되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || '계좌 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('customers/:customerId/accounts')
  async getAccountsByCustomerId(
    @Param('customerId', ParseIntPipe) customerId: number,
  ): Promise<CrmApiResponse<Account[]>> {
    try {
      const accounts =
        await this.crmService.getAccountsByCustomerId(customerId);
      return {
        data: accounts,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '계좌 목록 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('accounts/:id')
  async updateAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateAccountDto: UpdateAccountDto,
  ): Promise<CrmApiResponse<Account>> {
    try {
      const account = await this.crmService.updateAccount(id, updateAccountDto);
      return {
        data: account,
        message: '계좌 정보가 성공적으로 업데이트되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || '계좌 정보 업데이트 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 투자상품 API ====================

  @Post('products')
  async createProduct(
    @Body(ValidationPipe) createProductDto: CreateProductDto,
  ): Promise<CrmApiResponse<Product>> {
    try {
      const product = await this.crmService.createProduct(createProductDto);
      return {
        data: product,
        message: '상품이 성공적으로 생성되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || '상품 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('products')
  async getProducts(): Promise<CrmApiResponse<Product[]>> {
    try {
      const products = await this.crmService.getProducts();
      return {
        data: products,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '상품 목록 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('products/:id')
  async getProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CrmApiResponse<Product>> {
    try {
      const product = await this.crmService.getProductById(id);
      return {
        data: product,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '상품 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('products/:id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateProductDto: UpdateProductDto,
  ): Promise<CrmApiResponse<Product>> {
    try {
      const product = await this.crmService.updateProduct(id, updateProductDto);
      return {
        data: product,
        message: '상품 정보가 성공적으로 업데이트되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || '상품 정보 업데이트 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 거래내역 API ====================

  @Post('transactions')
  async createTransaction(
    @Body(ValidationPipe) createTransactionDto: CreateTransactionDto,
  ): Promise<CrmApiResponse<Transaction>> {
    try {
      const transaction =
        await this.crmService.createTransaction(createTransactionDto);
      return {
        data: transaction,
        message: '거래가 성공적으로 생성되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || '거래 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transactions')
  async getTransactions(
    @Query() query: TransactionSearchParams,
  ): Promise<CrmApiResponse<PaginatedResponse<Transaction>>> {
    try {
      const transactions = await this.crmService.getTransactions(query);
      return {
        data: transactions,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '거래내역 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 통계 API ====================

  @Get('statistics/customers')
  async getCustomerStatistics(): Promise<
    CrmApiResponse<{
      totalCustomers: number;
      activeCustomers: number;
      vipCustomers: number;
      newCustomersThisMonth: number;
    }>
  > {
    try {
      const statistics = await this.crmService.getCustomerStatistics();
      return {
        data: statistics,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '고객 통계 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics/transactions')
  async getTransactionStatistics(): Promise<
    CrmApiResponse<{
      totalTransactions: number;
      totalVolume: number;
      buyTransactions: number;
      sellTransactions: number;
    }>
  > {
    try {
      const statistics = await this.crmService.getTransactionStatistics();
      return {
        data: statistics,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '거래 통계 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
