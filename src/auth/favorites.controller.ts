import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  CurrentUser,
  type CurrentUserData,
} from './decorators/current-user.decorator';
import { UsersService } from './users.service';
import type { PipeTransform } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const FavoriteParamsSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(10)
    .transform((val) => val.toUpperCase()),
});

const CreateAlertSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(10)
    .transform((val) => val.toUpperCase()),
  targetPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  condition: z.enum(['above', 'below']),
});

const FavoriteParamsPipe: PipeTransform<
  unknown,
  z.infer<typeof FavoriteParamsSchema>
> = new ZodValidationPipe<z.infer<typeof FavoriteParamsSchema>>(
  FavoriteParamsSchema,
);
const CreateAlertPipe: PipeTransform<
  unknown,
  z.infer<typeof CreateAlertSchema>
> = new ZodValidationPipe<z.infer<typeof CreateAlertSchema>>(CreateAlertSchema);

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getFavorites(@CurrentUser() user: CurrentUserData) {
    return this.usersService.getFavorites(user.id);
  }

  @Post(':symbol')
  async addToFavorites(
    @CurrentUser() user: CurrentUserData,
    @Param(FavoriteParamsPipe)
    params: z.infer<typeof FavoriteParamsSchema>,
  ) {
    await this.usersService.addToFavorites(user.id, params.symbol);
    return { message: 'Added to favorites', symbol: params.symbol };
  }

  @Delete(':symbol')
  async removeFromFavorites(
    @CurrentUser() user: CurrentUserData,
    @Param(FavoriteParamsPipe)
    params: z.infer<typeof FavoriteParamsSchema>,
  ) {
    await this.usersService.removeFromFavorites(user.id, params.symbol);
    return { message: 'Removed from favorites', symbol: params.symbol };
  }

  @Get(':symbol/check')
  async checkFavorite(
    @CurrentUser() user: CurrentUserData,
    @Param(FavoriteParamsPipe)
    params: z.infer<typeof FavoriteParamsSchema>,
  ) {
    const isFavorite = await this.usersService.isFavorite(
      user.id,
      params.symbol,
    );
    return { symbol: params.symbol, isFavorite };
  }
}

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getPriceAlerts(@CurrentUser() user: CurrentUserData) {
    return this.usersService.getPriceAlerts(user.id);
  }

  @Post()
  async createPriceAlert(
    @CurrentUser() user: CurrentUserData,
    @Body(CreateAlertPipe)
    alertData: z.infer<typeof CreateAlertSchema>,
  ) {
    const alert = await this.usersService.createPriceAlert(user.id, alertData);
    return { message: 'Price alert created', alert };
  }
}
