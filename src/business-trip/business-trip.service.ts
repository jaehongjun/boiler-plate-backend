import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc, sql, ilike, gte, lte } from 'drizzle-orm';
import {
  cities,
  places,
  placeVisits,
  placeReviews,
} from '../database/schemas/business-trip.schema';
import { countries } from '../database/schemas/investor.schema';
import {
  CreateCityDto,
  CreatePlaceDto,
  CreatePlaceVisitDto,
  CreatePlaceReviewDto,
  GetPlacesByCityDto,
} from './dto/business-trip.dto';

@Injectable()
export class BusinessTripService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase<any>,
  ) {}

  /**
   * GET /api/business-trips/cities
   * Get all cities
   */
  async getCities() {
    const result = await this.db
      .select({
        id: cities.id,
        name: cities.name,
        nameEn: cities.nameEn,
        countryCode: cities.countryCode,
        countryName: countries.nameKo,
        countryNameEn: countries.nameEn,
        timezone: cities.timezone,
        latitude: cities.latitude,
        longitude: cities.longitude,
      })
      .from(cities)
      .leftJoin(countries, eq(cities.countryCode, countries.code))
      .orderBy(cities.name);

    return result;
  }

  /**
   * GET /api/business-trips/map-statistics
   * Get city statistics for map visualization
   */
  async getMapStatistics() {
    // Get all cities with coordinates
    const allCities = await this.db
      .select({
        id: cities.id,
        name: cities.name,
        nameEn: cities.nameEn,
        countryCode: cities.countryCode,
        latitude: cities.latitude,
        longitude: cities.longitude,
      })
      .from(cities)
      .where(sql`${cities.latitude} IS NOT NULL AND ${cities.longitude} IS NOT NULL`);

    // Calculate statistics for each city
    const citiesWithStats = await Promise.all(
      allCities.map(async (city) => {
        // Get total visit count
        const [visitStats] = await this.db
          .select({
            totalVisits: sql<number>`COUNT(DISTINCT ${placeVisits.id})`,
            lastVisitDate: sql<string>`MAX(${placeVisits.startDate})`,
          })
          .from(placeVisits)
          .leftJoin(places, eq(placeVisits.placeId, places.id))
          .where(eq(places.cityId, city.id));

        // Get place counts by type
        const [placeStats] = await this.db
          .select({
            hotelCount: sql<number>`COUNT(*) FILTER (WHERE ${places.type} = 'HOTEL')`,
            restaurantCount: sql<number>`COUNT(*) FILTER (WHERE ${places.type} = 'RESTAURANT')`,
          })
          .from(places)
          .where(eq(places.cityId, city.id));

        return {
          ...city,
          statistics: {
            totalVisits: Number(visitStats.totalVisits) || 0,
            hotelCount: Number(placeStats.hotelCount) || 0,
            restaurantCount: Number(placeStats.restaurantCount) || 0,
            lastVisitDate: visitStats.lastVisitDate || null,
          },
        };
      }),
    );

    return citiesWithStats;
  }

  /**
   * POST /api/business-trips/cities
   * Create a new city
   */
  async createCity(dto: CreateCityDto) {
    const [city] = await this.db
      .insert(cities)
      .values(dto as any)
      .returning();

    return city;
  }

  /**
   * GET /api/business-trips/cities/:cityId/places
   * Get places by city with filters
   */
  async getPlacesByCity(cityId: number, dto: GetPlacesByCityDto) {
    const { type } = dto;

    const conditions: any[] = [eq(places.cityId, cityId)];
    if (type) {
      conditions.push(eq(places.type, type));
    }

    const result = await this.db
      .select({
        id: places.id,
        name: places.name,
        type: places.type,
        address: places.address,
        averageRating: places.averageRating,
        visitCount: places.visitCount,
        lastVisitDate: places.lastVisitDate,
        phone: places.phone,
        website: places.website,
        notes: places.notes,
        cityId: places.cityId,
        cityName: cities.name,
      })
      .from(places)
      .leftJoin(cities, eq(places.cityId, cities.id))
      .where(and(...conditions))
      .orderBy(desc(places.lastVisitDate), desc(places.visitCount));

    // Get visit history for each place
    const placesWithVisits = await Promise.all(
      result.map(async (place) => {
        const visits = await this.db
          .select({
            id: placeVisits.id,
            startDate: placeVisits.startDate,
            endDate: placeVisits.endDate,
            nights: placeVisits.nights,
            companions: placeVisits.companions,
            notes: placeVisits.notes,
            createdAt: placeVisits.createdAt,
          })
          .from(placeVisits)
          .where(eq(placeVisits.placeId, place.id))
          .orderBy(desc(placeVisits.startDate));

        return {
          ...place,
          visits,
        };
      }),
    );

    return {
      places: placesWithVisits,
    };
  }

  /**
   * POST /api/business-trips/places
   * Create a new place (hotel/restaurant)
   */
  async createPlace(dto: CreatePlaceDto) {
    const [place] = await this.db
      .insert(places)
      .values(dto as any)
      .returning();

    return place;
  }

  /**
   * GET /api/business-trips/places/:placeId
   * Get place detail with all visits and reviews
   */
  async getPlaceDetail(placeId: number) {
    const [place] = await this.db
      .select({
        id: places.id,
        name: places.name,
        type: places.type,
        address: places.address,
        averageRating: places.averageRating,
        visitCount: places.visitCount,
        lastVisitDate: places.lastVisitDate,
        phone: places.phone,
        website: places.website,
        notes: places.notes,
        cityId: places.cityId,
        cityName: cities.name,
      })
      .from(places)
      .leftJoin(cities, eq(places.cityId, cities.id))
      .where(eq(places.id, placeId));

    if (!place) {
      throw new NotFoundException(`Place with id ${placeId} not found`);
    }

    // Get visits with reviews
    const visits = await this.db
      .select({
        id: placeVisits.id,
        startDate: placeVisits.startDate,
        endDate: placeVisits.endDate,
        nights: placeVisits.nights,
        companions: placeVisits.companions,
        notes: placeVisits.notes,
        createdAt: placeVisits.createdAt,
      })
      .from(placeVisits)
      .where(eq(placeVisits.placeId, placeId))
      .orderBy(desc(placeVisits.startDate));

    const visitsWithReviews = await Promise.all(
      visits.map(async (visit) => {
        const reviews = await this.db
          .select({
            id: placeReviews.id,
            rating: placeReviews.rating,
            content: placeReviews.content,
            createdAt: placeReviews.createdAt,
          })
          .from(placeReviews)
          .where(eq(placeReviews.visitId, visit.id));

        return {
          ...visit,
          reviews,
        };
      }),
    );

    return {
      ...place,
      visits: visitsWithReviews,
    };
  }

  /**
   * POST /api/business-trips/visits
   * Create a new place visit
   */
  async createPlaceVisit(dto: CreatePlaceVisitDto, userId: string) {
    const [visit] = await this.db
      .insert(placeVisits)
      .values({
        ...dto,
        userId,
      } as any)
      .returning();

    // Update place statistics
    await this.updatePlaceStatistics(dto.placeId);

    return visit;
  }

  /**
   * POST /api/business-trips/reviews
   * Create a new place review
   */
  async createPlaceReview(dto: CreatePlaceReviewDto, userId: string) {
    const [review] = await this.db
      .insert(placeReviews)
      .values({
        ...dto,
        userId,
      } as any)
      .returning();

    // Update place average rating
    await this.updatePlaceStatistics(dto.placeId);

    return review;
  }

  /**
   * Update place statistics (average rating, visit count, last visit date)
   */
  private async updatePlaceStatistics(placeId: number) {
    // Calculate average rating
    const [ratingResult] = await this.db
      .select({
        avgRating: sql<string>`AVG(${placeReviews.rating})`,
      })
      .from(placeReviews)
      .where(eq(placeReviews.placeId, placeId));

    // Get visit count and last visit date
    const [visitResult] = await this.db
      .select({
        count: sql<number>`COUNT(*)`,
        lastVisit: sql<string>`MAX(${placeVisits.startDate})`,
      })
      .from(placeVisits)
      .where(eq(placeVisits.placeId, placeId));

    // Update place
    await this.db
      .update(places)
      .set({
        averageRating: ratingResult.avgRating
          ? parseFloat(ratingResult.avgRating).toFixed(2)
          : null,
        visitCount: visitResult.count || 0,
        lastVisitDate: visitResult.lastVisit || null,
        updatedAt: new Date(),
      })
      .where(eq(places.id, placeId));
  }
}
