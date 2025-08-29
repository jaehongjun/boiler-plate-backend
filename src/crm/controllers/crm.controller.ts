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
@UseFilters(CrmExceptionFilter)
@ApiTags('CRM')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ==================== 고객 관리 API ====================

  @UseGuards(JwtAuthGuard)
  @Post('customers')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '고객 생성',
    description: '새로운 고객을 생성합니다.',
  })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({
    status: 201,
    description: '고객 생성 성공',
  })
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
        error instanceof Error
          ? error.message
          : '고객 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('customers')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '고객 목록 조회',
    description: '고객 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '고객 목록 조회 성공',
  })
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
        error instanceof Error
          ? error.message
          : '고객 목록 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('customers/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '고객 상세 조회',
    description: '특정 고객의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '고객 상세 조회 성공',
  })
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
        error instanceof Error
          ? error.message
          : '고객 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('customers/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '고객 정보 수정',
    description: '고객 정보를 수정합니다.',
  })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({
    status: 200,
    description: '고객 정보 수정 성공',
  })
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
        error instanceof Error
          ? error.message
          : '고객 정보 업데이트 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('customers/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '고객 삭제',
    description: '고객을 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '고객 삭제 성공',
  })
  async deleteCustomer(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CrmApiResponse<void>> {
    try {
      await this.crmService.deleteCustomer(id);
      return {
        data: undefined,
        message: '고객이 성공적으로 삭제되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error
          ? error.message
          : '고객 삭제 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 상담/문의 이력 API ====================

  @UseGuards(JwtAuthGuard)
  @Post('customers/:customerId/contacts')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '상담 이력 생성',
    description: '고객의 상담 이력을 생성합니다.',
  })
  @ApiBody({ type: CreateContactHistoryDto })
  @ApiResponse({
    status: 201,
    description: '상담 이력 생성 성공',
  })
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
        error instanceof Error
          ? error.message
          : '상담 이력 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('customers/:customerId/contacts')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '고객 상담 이력 조회',
    description: '특정 고객의 상담 이력을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상담 이력 조회 성공',
  })
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
        error instanceof Error
          ? error.message
          : '상담 이력 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 투자계좌 API ====================

  @UseGuards(JwtAuthGuard)
  @Post('customers/:customerId/accounts')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '계좌 생성',
    description: '고객의 투자계좌를 생성합니다.',
  })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({
    status: 201,
    description: '계좌 생성 성공',
  })
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
        error instanceof Error
          ? error.message
          : '계좌 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('customers/:customerId/accounts')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '고객 계좌 목록 조회',
    description: '특정 고객의 계좌 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '계좌 목록 조회 성공',
  })
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
        error instanceof Error
          ? error.message
          : '계좌 목록 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('accounts/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '계좌 정보 수정',
    description: '계좌 정보를 수정합니다.',
  })
  @ApiBody({ type: UpdateAccountDto })
  @ApiResponse({
    status: 200,
    description: '계좌 정보 수정 성공',
  })
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
        error instanceof Error
          ? error.message
          : '계좌 정보 업데이트 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 투자상품 API ====================

  @UseGuards(JwtAuthGuard)
  @Post('products')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '상품 생성',
    description: '투자상품을 생성합니다.',
  })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: '상품 생성 성공',
  })
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
        error instanceof Error
          ? error.message
          : '상품 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('products')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '상품 목록 조회',
    description: '투자상품 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상품 목록 조회 성공',
  })
  async getProducts(): Promise<CrmApiResponse<Product[]>> {
    try {
      const products = await this.crmService.getProducts();
      return {
        data: products,
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error
          ? error.message
          : '상품 목록 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('products/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '상품 상세 조회',
    description: '특정 투자상품의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상품 상세 조회 성공',
  })
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
        error instanceof Error
          ? error.message
          : '상품 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('products/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '상품 정보 수정',
    description: '투자상품 정보를 수정합니다.',
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: '상품 정보 수정 성공',
  })
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
        error instanceof Error
          ? error.message
          : '상품 정보 업데이트 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 거래내역 API ====================

  @UseGuards(JwtAuthGuard)
  @Post('transactions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '거래 생성',
    description: '새로운 거래를 생성합니다.',
  })
  @ApiBody({ type: CreateTransactionDto })
  @ApiResponse({
    status: 201,
    description: '거래 생성 성공',
  })
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
        error instanceof Error
          ? error.message
          : '거래 생성 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '거래내역 조회',
    description: '거래내역을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '거래내역 조회 성공',
  })
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
        error instanceof Error
          ? error.message
          : '거래내역 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 통계 API ====================

  @UseGuards(JwtAuthGuard)
  @Get('statistics/customers')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '고객 통계 조회',
    description: '고객 통계 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '고객 통계 조회 성공',
  })
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
        error instanceof Error
          ? error.message
          : '고객 통계 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('statistics/transactions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '거래 통계 조회',
    description: '거래 통계 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '거래 통계 조회 성공',
  })
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
        error instanceof Error
          ? error.message
          : '거래 통계 조회 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
