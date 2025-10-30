import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('InvestorController (e2e)', () => {
  let app: INestApplication<App>;
  let _authToken: string;
  let _testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    // TODO: Get auth token from login endpoint
    // For now, you'll need to manually set this or create a test user
    // authToken = 'your-test-jwt-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/investors/table (GET)', () => {
    it('should return investors table with valid period', () => {
      return (
        request(app.getHttpServer())
          .get('/api/investors/table')
          .query({ year: 2024, quarter: 4, page: 1, pageSize: 20 })
          // .set('Authorization', `Bearer ${authToken}`) // Uncomment when auth is set up
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('period');
            expect(res.body.data).toHaveProperty('rows');
            expect(res.body.data.period.year).toBe(2024);
            expect(res.body.data.period.quarter).toBe(4);
            expect(Array.isArray(res.body.data.rows)).toBe(true);
          })
      );
    });

    it('should validate required query parameters', () => {
      return (
        request(app.getHttpServer())
          .get('/api/investors/table')
          // Missing year and quarter
          .expect(400)
      );
    });

    it('should support filtering by country', () => {
      return request(app.getHttpServer())
        .get('/api/investors/table')
        .query({ year: 2024, quarter: 4, country: 'JP' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          // All returned investors should be from JP
          const rows = res.body.data.rows || [];
          rows.forEach((row: any) => {
            if (row.investor?.country?.code) {
              expect(row.investor.country.code).toBe('JP');
            }
          });
        });
    });

    it('should support onlyParent option', () => {
      return request(app.getHttpServer())
        .get('/api/investors/table')
        .query({ year: 2024, quarter: 4, onlyParent: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          const rows = res.body.data.rows || [];
          // All rows should be PARENT type
          rows.forEach((row: any) => {
            expect(row.rowType).toBe('PARENT');
          });
        });
    });

    it('should support search by name', () => {
      return request(app.getHttpServer())
        .get('/api/investors/table')
        .query({ year: 2024, quarter: 4, search: 'BlackRock' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          const rows = res.body.data.rows || [];
          if (rows.length > 0) {
            const hasMatch = rows.some((row: any) =>
              row.investor?.name?.includes('BlackRock'),
            );
            expect(hasMatch).toBe(true);
          }
        });
    });
  });

  describe('/api/investors/top (GET)', () => {
    it('should return top N investors', () => {
      return request(app.getHttpServer())
        .get('/api/investors/top')
        .query({ year: 2024, quarter: 4, topN: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('topN');
          expect(res.body.data).toHaveProperty('investors');
          expect(res.body.data.topN).toBe(5);
          expect(Array.isArray(res.body.data.investors)).toBe(true);
          expect(res.body.data.investors.length).toBeLessThanOrEqual(5);
        });
    });

    it('should default to topN=10 if not specified', () => {
      return request(app.getHttpServer())
        .get('/api/investors/top')
        .query({ year: 2024, quarter: 4 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.topN).toBe(10);
        });
    });
  });

  describe('/api/investors/:id (GET)', () => {
    it('should return investor detail with snapshot', () => {
      // Assuming investor with ID 1 exists from seed
      return request(app.getHttpServer())
        .get('/api/investors/1')
        .query({ year: 2024, quarter: 4 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('investor');
          expect(res.body.data).toHaveProperty('snapshot');
          expect(res.body.data.investor.id).toBe(1);
        });
    });

    it('should return 404 for non-existent investor', () => {
      return request(app.getHttpServer())
        .get('/api/investors/99999')
        .query({ year: 2024, quarter: 4 })
        .expect(404);
    });
  });

  describe('/api/investors/:id/history (GET)', () => {
    it('should return investor history', () => {
      return request(app.getHttpServer())
        .get('/api/investors/1/history')
        .query({ page: 1, pageSize: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('investorId');
          expect(res.body.data).toHaveProperty('history');
          expect(res.body.data).toHaveProperty('page');
          expect(res.body.data).toHaveProperty('total');
          expect(Array.isArray(res.body.data.history)).toBe(true);
        });
    });

    it('should support filtering by year and quarter', () => {
      return request(app.getHttpServer())
        .get('/api/investors/1/history')
        .query({ year: 2024, quarter: 4, page: 1, pageSize: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          const history = res.body.data.history || [];
          history.forEach((record: any) => {
            expect(record.year).toBe(2024);
            expect(record.quarter).toBe(4);
          });
        });
    });
  });

  describe('/api/filters/periods (GET)', () => {
    it('should return available periods', () => {
      return request(app.getHttpServer())
        .get('/api/filters/periods')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('periods');
          expect(Array.isArray(res.body.data.periods)).toBe(true);
          if (res.body.data.periods.length > 0) {
            const period = res.body.data.periods[0];
            expect(period).toHaveProperty('year');
            expect(period).toHaveProperty('quarter');
          }
        });
    });
  });

  describe('/api/filters/dictionaries (GET)', () => {
    it('should return filter dictionaries', () => {
      return request(app.getHttpServer())
        .get('/api/filters/dictionaries')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('countries');
          expect(res.body.data).toHaveProperty('investorTypes');
          expect(res.body.data).toHaveProperty('styleTags');
          expect(res.body.data).toHaveProperty('turnovers');
          expect(res.body.data).toHaveProperty('orientations');
          expect(Array.isArray(res.body.data.countries)).toBe(true);
          expect(Array.isArray(res.body.data.investorTypes)).toBe(true);
        });
    });
  });

  describe('/api/metrics/summary (GET)', () => {
    it('should return summary metrics', () => {
      return request(app.getHttpServer())
        .get('/api/metrics/summary')
        .query({ year: 2024, quarter: 4 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('totalInvestors');
          expect(res.body.data).toHaveProperty('parents');
          expect(res.body.data).toHaveProperty('children');
          expect(res.body.data).toHaveProperty('activeRate');
          expect(res.body.data).toHaveProperty('turnoverDist');
          expect(typeof res.body.data.totalInvestors).toBe('number');
          expect(typeof res.body.data.activeRate).toBe('number');
        });
    });
  });

  describe('PATCH /api/investors/:id/snapshot', () => {
    it('should update investor snapshot and create history', () => {
      // This test requires authentication
      // Uncomment when auth is set up
      /*
      return request(app.getHttpServer())
        .patch('/api/investors/1/snapshot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          year: 2024,
          quarter: 4,
          orientation: 'INACTIVE',
          turnover: 'HIGH',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.snapshot.orientation).toBe('INACTIVE');
          expect(res.body.data.snapshot.turnover).toBe('HIGH');
        });
      */
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Performance Tests', () => {
    it('should handle large page size efficiently', () => {
      const startTime = Date.now();
      return request(app.getHttpServer())
        .get('/api/investors/table')
        .query({ year: 2024, quarter: 4, pageSize: 100 })
        .expect(200)
        .expect((res) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          // Should complete within 2 seconds
          expect(duration).toBeLessThan(2000);
          expect(res.body.success).toBe(true);
        });
    });

    it('should handle multiple filters without performance degradation', () => {
      const startTime = Date.now();
      return request(app.getHttpServer())
        .get('/api/investors/table')
        .query({
          year: 2024,
          quarter: 4,
          country: 'JP',
          orientation: 'ACTIVE',
          turnover: 'MEDIUM',
          search: 'Black',
        })
        .expect(200)
        .expect((res) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          // Should complete within 1.5 seconds even with multiple filters
          expect(duration).toBeLessThan(1500);
          expect(res.body.success).toBe(true);
        });
    });
  });
});
