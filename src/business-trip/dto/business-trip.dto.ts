import { z } from 'zod';

// ==================== City DTOs ====================

export const createCitySchema = z.object({
  name: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  countryCode: z.string().length(2),
  timezone: z.string().max(50).optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export type CreateCityDto = z.infer<typeof createCitySchema>;

// ==================== Place DTOs ====================

export const createPlaceSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['HOTEL', 'RESTAURANT']),
  cityId: z.coerce.number().int().positive(),
  address: z.string().min(1),
  phone: z.string().max(50).optional(),
  website: z.string().max(300).optional(),
  notes: z.string().optional(),
});

export type CreatePlaceDto = z.infer<typeof createPlaceSchema>;

export const getPlacesByCitySchema = z.object({
  type: z.enum(['HOTEL', 'RESTAURANT']).optional(),
});

export type GetPlacesByCityDto = z.infer<typeof getPlacesByCitySchema>;

// ==================== Place Visit DTOs ====================

export const createPlaceVisitSchema = z.object({
  placeId: z.coerce.number().int().positive(),
  startDate: z.string(),
  endDate: z.string(),
  nights: z.coerce.number().int().min(0).optional(),
  companions: z
    .array(
      z.enum([
        'C_LEVEL',
        'DIRECTOR',
        'MANAGER',
        'TEAM_MEMBER',
        'PARTNER',
        'OTHER',
      ]),
    )
    .optional(),
  notes: z.string().optional(),
});

export type CreatePlaceVisitDto = z.infer<typeof createPlaceVisitSchema>;

// ==================== Place Review DTOs ====================

export const createPlaceReviewSchema = z.object({
  placeId: z.coerce.number().int().positive(),
  visitId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().optional(),
});

export type CreatePlaceReviewDto = z.infer<typeof createPlaceReviewSchema>;
