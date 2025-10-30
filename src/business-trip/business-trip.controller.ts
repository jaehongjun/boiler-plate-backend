import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BusinessTripService } from './business-trip.service';
import {
  CreateCityDto,
  CreatePlaceDto,
  CreatePlaceVisitDto,
  CreatePlaceReviewDto,
  GetPlacesByCityDto,
  createCitySchema,
  createPlaceSchema,
  createPlaceVisitSchema,
  createPlaceReviewSchema,
  getPlacesByCitySchema,
} from './dto/business-trip.dto';

@ApiTags('business-trips')
@Controller('business-trips')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessTripController {
  constructor(private readonly businessTripService: BusinessTripService) {}

  /**
   * GET /api/business-trips/map-statistics
   * 지도 표시용 도시별 통계 조회
   */
  @Get('map-statistics')
  @ApiOperation({
    summary: '지도 표시용 도시별 통계 조회',
    description:
      '지도에 표시할 도시별 좌표와 통계 정보(방문 횟수, 호텔/레스토랑 수)를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '지도 통계 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: '베를린' },
          nameEn: { type: 'string', example: 'Berlin' },
          countryCode: { type: 'string', example: 'DE' },
          latitude: { type: 'string', example: '52.5200066' },
          longitude: { type: 'string', example: '13.4049540' },
          statistics: {
            type: 'object',
            properties: {
              totalVisits: { type: 'number', example: 64 },
              hotelCount: { type: 'number', example: 5 },
              restaurantCount: { type: 'number', example: 3 },
              lastVisitDate: { type: 'string', example: '2025-08-26' },
            },
          },
        },
      },
    },
  })
  async getMapStatistics() {
    return this.businessTripService.getMapStatistics();
  }

  /**
   * GET /api/business-trips/cities
   * 도시 목록 조회
   */
  @Get('cities')
  @ApiOperation({
    summary: '도시 목록 조회',
    description: '모든 도시 목록을 국가 정보와 함께 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '도시 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: '베를린' },
          nameEn: { type: 'string', example: 'Berlin' },
          countryCode: { type: 'string', example: 'DE' },
          countryName: { type: 'string', example: '독일' },
          countryNameEn: { type: 'string', example: 'Germany' },
          timezone: { type: 'string', example: 'Europe/Berlin' },
          latitude: { type: 'string', example: '52.5200066' },
          longitude: { type: 'string', example: '13.4049540' },
        },
      },
    },
  })
  async getCities() {
    return this.businessTripService.getCities();
  }

  /**
   * POST /api/business-trips/cities
   * 도시 생성
   */
  @Post('cities')
  @ApiOperation({
    summary: '도시 생성',
    description: '새로운 도시를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '도시 생성 성공',
  })
  async createCity(
    @Body(new ZodValidationPipe(createCitySchema)) dto: CreateCityDto,
  ) {
    return this.businessTripService.createCity(dto);
  }

  /**
   * GET /api/business-trips/cities/:cityId/places
   * 도시별 장소 목록 조회 (호텔/레스토랑)
   */
  @Get('cities/:cityId/places')
  @ApiOperation({
    summary: '도시별 주변 정보 조회',
    description:
      '특정 도시의 호텔/레스토랑 목록을 방문 기록과 함께 조회합니다.',
  })
  @ApiParam({
    name: 'cityId',
    type: 'number',
    description: '도시 ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '장소 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        places: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Hilton Berlin' },
              type: { type: 'string', example: 'HOTEL' },
              address: {
                type: 'string',
                example: 'Stauffenbergstraße 26, 10785 Berlin, Germany',
              },
              averageRating: { type: 'string', example: '4.00' },
              visitCount: { type: 'number', example: 4 },
              lastVisitDate: { type: 'string', example: '2025-08-26' },
              visits: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    startDate: { type: 'string', example: '2025-08-24' },
                    endDate: { type: 'string', example: '2025-08-26' },
                    nights: { type: 'number', example: 2 },
                    companions: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['C_LEVEL', 'DIRECTOR'],
                    },
                    notes: { type: 'string', example: '공항 픽업 필요' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async getPlacesByCity(
    @Param('cityId', ParseIntPipe) cityId: number,
    @Query(new ZodValidationPipe(getPlacesByCitySchema))
    dto: GetPlacesByCityDto,
  ) {
    return this.businessTripService.getPlacesByCity(cityId, dto);
  }

  /**
   * POST /api/business-trips/places
   * 장소 추가 (호텔/레스토랑)
   */
  @Post('places')
  @ApiOperation({
    summary: '장소 추가',
    description: '새로운 호텔/레스토랑 정보를 추가합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '장소 추가 성공',
  })
  async createPlace(
    @Body(new ZodValidationPipe(createPlaceSchema)) dto: CreatePlaceDto,
  ) {
    return this.businessTripService.createPlace(dto);
  }

  /**
   * GET /api/business-trips/places/:placeId
   * 장소 상세 조회
   */
  @Get('places/:placeId')
  @ApiOperation({
    summary: '장소 상세 조회',
    description: '특정 장소의 상세 정보를 모든 방문 기록 및 리뷰와 함께 조회합니다.',
  })
  @ApiParam({
    name: 'placeId',
    type: 'number',
    description: '장소 ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '장소 상세 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '장소를 찾을 수 없음',
  })
  async getPlaceDetail(@Param('placeId', ParseIntPipe) placeId: number) {
    return this.businessTripService.getPlaceDetail(placeId);
  }

  /**
   * POST /api/business-trips/visits
   * 방문 기록 추가
   */
  @Post('visits')
  @ApiOperation({
    summary: '방문 기록 추가',
    description: '장소에 대한 새로운 방문 기록을 추가합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '방문 기록 추가 성공',
  })
  async createPlaceVisit(
    @Body(new ZodValidationPipe(createPlaceVisitSchema))
    dto: CreatePlaceVisitDto,
    @Request() req: any,
  ) {
    return this.businessTripService.createPlaceVisit(dto, req.user.sub);
  }

  /**
   * POST /api/business-trips/reviews
   * 리뷰 추가
   */
  @Post('reviews')
  @ApiOperation({
    summary: '리뷰 추가',
    description: '방문 기록에 대한 리뷰를 추가합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '리뷰 추가 성공',
  })
  async createPlaceReview(
    @Body(new ZodValidationPipe(createPlaceReviewSchema))
    dto: CreatePlaceReviewDto,
    @Request() req: any,
  ) {
    return this.businessTripService.createPlaceReview(dto, req.user.sub);
  }
}
