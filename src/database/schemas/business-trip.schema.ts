import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  serial,
  pgEnum,
  index,
  decimal,
  date,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from './users';
import { countries } from './investor.schema';

// ==================== Enums ====================

export const placeTypeEnum = pgEnum('place_type', ['HOTEL', 'RESTAURANT']);

export const companionTypeEnum = pgEnum('companion_type', [
  'C_LEVEL',
  'DIRECTOR',
  'MANAGER',
  'TEAM_MEMBER',
  'PARTNER',
  'OTHER',
]);

// ==================== Cities ====================

export const cities = pgTable(
  'cities',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    nameEn: varchar('name_en', { length: 100 }).notNull(),
    countryCode: varchar('country_code', { length: 2 })
      .notNull()
      .references(() => countries.code, { onDelete: 'cascade' }),
    timezone: varchar('timezone', { length: 50 }), // Asia/Seoul, Europe/Berlin 등
    // 지도 표시용 좌표
    latitude: decimal('latitude', { precision: 10, scale: 7 }), // 위도 (예: 37.5665)
    longitude: decimal('longitude', { precision: 10, scale: 7 }), // 경도 (예: 126.9780)
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    nameIdx: index('cities_name_idx').on(t.name),
    countryIdx: index('cities_country_idx').on(t.countryCode),
  }),
);

// ==================== Places (Hotels/Restaurants) ====================

export const places = pgTable(
  'places',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    type: placeTypeEnum('type').notNull(),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id, { onDelete: 'cascade' }),
    address: text('address').notNull(),
    // 평균 평점 (denormalized for performance)
    averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
    // 방문 횟수 (denormalized for performance)
    visitCount: integer('visit_count').default(0).notNull(),
    // 최근 방문일 (denormalized for performance)
    lastVisitDate: date('last_visit_date'),

    // 추가 정보
    phone: varchar('phone', { length: 50 }),
    website: varchar('website', { length: 300 }),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    nameIdx: index('places_name_idx').on(t.name),
    cityIdx: index('places_city_idx').on(t.cityId),
    typeIdx: index('places_type_idx').on(t.type),
    lastVisitIdx: index('places_last_visit_idx').on(t.lastVisitDate),
  }),
);

// ==================== Place Visits ====================

export const placeVisits = pgTable(
  'place_visits',
  {
    id: serial('id').primaryKey(),
    placeId: integer('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // 방문 날짜
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    nights: integer('nights'), // N박

    // 동행자 정보
    companions: companionTypeEnum('companions').array(), // 배열로 여러 동행자 타입 저장

    // 비고
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    placeIdx: index('place_visits_place_idx').on(t.placeId),
    userIdx: index('place_visits_user_idx').on(t.userId),
    dateIdx: index('place_visits_date_idx').on(t.startDate),
  }),
);

// ==================== Place Reviews ====================

export const placeReviews = pgTable(
  'place_reviews',
  {
    id: serial('id').primaryKey(),
    placeId: integer('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    visitId: integer('visit_id')
      .notNull()
      .references(() => placeVisits.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // 평점 (1-5)
    rating: integer('rating').notNull(),

    // 리뷰 내용
    content: text('content'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    placeIdx: index('place_reviews_place_idx').on(t.placeId),
    visitIdx: index('place_reviews_visit_idx').on(t.visitId),
    userIdx: index('place_reviews_user_idx').on(t.userId),
  }),
);

// ==================== Relations ====================

export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, {
    fields: [cities.countryCode],
    references: [countries.code],
  }),
  places: many(places),
}));

export const placesRelations = relations(places, ({ one, many }) => ({
  city: one(cities, {
    fields: [places.cityId],
    references: [cities.id],
  }),
  visits: many(placeVisits),
  reviews: many(placeReviews),
}));

export const placeVisitsRelations = relations(placeVisits, ({ one, many }) => ({
  place: one(places, {
    fields: [placeVisits.placeId],
    references: [places.id],
  }),
  user: one(users, {
    fields: [placeVisits.userId],
    references: [users.id],
  }),
  reviews: many(placeReviews),
}));

export const placeReviewsRelations = relations(placeReviews, ({ one }) => ({
  place: one(places, {
    fields: [placeReviews.placeId],
    references: [places.id],
  }),
  visit: one(placeVisits, {
    fields: [placeReviews.visitId],
    references: [placeVisits.id],
  }),
  user: one(users, {
    fields: [placeReviews.userId],
    references: [users.id],
  }),
}));

// ==================== Zod Schemas ====================

export const insertCitySchema = createInsertSchema(cities);
export const selectCitySchema = createSelectSchema(cities);

export const insertPlaceSchema = createInsertSchema(places);
export const selectPlaceSchema = createSelectSchema(places);

export const insertPlaceVisitSchema = createInsertSchema(placeVisits);
export const selectPlaceVisitSchema = createSelectSchema(placeVisits);

export const insertPlaceReviewSchema = createInsertSchema(placeReviews);
export const selectPlaceReviewSchema = createSelectSchema(placeReviews);

// ==================== TypeScript Types ====================

export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;

export type PlaceVisit = typeof placeVisits.$inferSelect;
export type NewPlaceVisit = typeof placeVisits.$inferInsert;

export type PlaceReview = typeof placeReviews.$inferSelect;
export type NewPlaceReview = typeof placeReviews.$inferInsert;
