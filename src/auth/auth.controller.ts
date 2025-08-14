import { Controller, Post, Body, Get, UseGuards, Patch } from '@nestjs/common';
import type { PipeTransform } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  CurrentUser,
  type CurrentUserData,
} from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { z, type ZodSchema } from 'zod';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import {
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
  LoginResponseDto,
  UserProfileDto,
  LogoutResponseDto,
  RefreshDto,
} from './dto/auth.dto';

const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const createZodPipe = <TOutput>(
  schema: ZodSchema<TOutput>,
): PipeTransform<unknown, TOutput> => new ZodValidationPipe<TOutput>(schema);

const RegisterPipe =
  createZodPipe<z.infer<typeof RegisterSchema>>(RegisterSchema);
const LoginPipe = createZodPipe<z.infer<typeof LoginSchema>>(LoginSchema);
const UpdateProfilePipe =
  createZodPipe<z.infer<typeof UpdateProfileSchema>>(UpdateProfileSchema);
const RefreshPipe = createZodPipe<z.infer<typeof RefreshSchema>>(RefreshSchema);

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: '사용자 회원가입',
    description: '이메일, 비밀번호, 이름으로 회원가입합니다.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일' })
  async register(
    @Body(RegisterPipe)
    registerDto: z.infer<typeof RegisterSchema>,
  ) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }

  @Public()
  @Post('login')
  @ApiOperation({
    summary: '사용자 로그인',
    description: '이메일과 비밀번호로 로그인합니다.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: '잘못된 인증 정보' })
  async login(
    @Body(LoginPipe)
    loginDto: z.infer<typeof LoginSchema>,
  ) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '내 정보 조회',
    description: '현재 로그인한 사용자의 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  async getMe(@CurrentUser() user: CurrentUserData) {
    return this.authService.getUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '프로필 수정',
    description: '사용자의 프로필 정보를 수정합니다.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: '프로필 수정 성공',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body(UpdateProfilePipe)
    updateData: z.infer<typeof UpdateProfileSchema>,
  ) {
    return this.usersService.updateProfile(user.id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '로그아웃',
    description: '사용자를 로그아웃시킵니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
    type: LogoutResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  async logout(@CurrentUser() user: CurrentUserData) {
    await this.usersService.revokeUserTokens(user.id);
    return { message: 'Logged out successfully' } as const;
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: '리프레시 토큰으로 액세스 토큰 재발급' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  async refresh(
    @Body(RefreshPipe)
    body: z.infer<typeof RefreshSchema>,
  ) {
    return this.authService.refresh(body.refreshToken);
  }
}
