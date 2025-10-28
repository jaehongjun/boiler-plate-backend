import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import {
  investors,
  investorSnapshots,
  investorHistories,
  gidUploadBatches,
  gidUploadRows,
  countries,
} from '../database/schemas/investor.schema';
import {
  CreateGidUploadBatchDto,
  ProcessGidUploadDto,
  ParsedGidRow,
  GidUploadBatchResponse,
  ProcessGidUploadResponse,
  GidUploadRowsResponse,
} from './dto/gid-upload.dto';
import { createSnapshotDiff } from '../database/utils/investor-history-diff';

@Injectable()
export class GidService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase<any>,
  ) {}

  /**
   * 파일 업로드 및 배치 생성
   */
  async createUploadBatch(
    file: Express.Multer.File,
    dto: CreateGidUploadBatchDto,
    userId: string,
  ): Promise<GidUploadBatchResponse> {
    // 파일 형식 검증
    const allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only CSV and Excel files are allowed.',
      );
    }

    // 파일 파싱
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      throw new BadRequestException('File is empty');
    }

    // 배치 생성
    const [batch] = await this.db
      .insert(gidUploadBatches)
      .values({
        originalFilename: file.originalname,
        status: 'PENDING',
        meta: {
          totalRows: rawData.length,
          columns: Object.keys(rawData[0] as any),
          fileSize: file.size,
          year: dto.year,
          quarter: dto.quarter,
          description: dto.description,
        } as any,
        uploadedBy: userId,
      })
      .returning();

    // 원본 행 저장
    const rowsToInsert = rawData.map((row) => ({
      batchId: batch.id,
      raw: row as any,
    }));

    await this.db.insert(gidUploadRows).values(rowsToInsert);

    return {
      id: batch.id,
      originalFilename: batch.originalFilename!,
      status: batch.status,
      meta: batch.meta as any,
      uploadedAt: batch.uploadedAt.toISOString(),
    };
  }

  /**
   * 업로드 배치 처리 (파싱 + 매핑 + 스냅샷 생성)
   */
  async processUploadBatch(
    batchId: number,
    dto: ProcessGidUploadDto,
    userId: string,
  ): Promise<ProcessGidUploadResponse> {
    try {
      console.log('[GID] processUploadBatch started:', {
        batchId,
        dto,
        userId,
      });

      // 배치 조회
      const [batch] = await this.db
        .select()
        .from(gidUploadBatches)
        .where(eq(gidUploadBatches.id, batchId))
        .limit(1);

      console.log('[GID] Batch found:', batch);

      if (!batch) {
        throw new NotFoundException(`Upload batch ${batchId} not found`);
      }

      if (batch.status === 'PROCESSED') {
        throw new BadRequestException('Batch already processed');
      }

      const meta = batch.meta as any;
      const { year, quarter } = meta;
      console.log('[GID] Year/Quarter:', { year, quarter });

      //원본 행들 조회
      console.log('[GID] Querying rows for batchId:', batchId);
      const rows = await this.db
        .select()
        .from(gidUploadRows)
        .where(eq(gidUploadRows.batchId, batchId));
      console.log('[GID] Rows fetched:', rows.length);

      const errors: Array<{ row: number; message: string; data?: any }> = [];
      let parsedCount = 0;
      let createdInvestors = 0;
      let createdSnapshots = 0;
      let updatedSnapshots = 0;
      let historyCount = 0;

      // 국가 코드 매핑 (미리 로드)
      console.log('[GID] Loading countries...');
      const countryMap = new Map<string, string>();
      const allCountries = await this.db.select().from(countries);
      console.log('[GID] Countries loaded:', allCountries.length);
      for (const c of allCountries) {
        countryMap.set(c.code, c.code);
      }

      // REPLACE 모드: 기존 스냅샷 삭제
      if (dto.mode === 'REPLACE') {
        await this.db
          .delete(investorSnapshots)
          .where(
            and(
              eq(investorSnapshots.year, year),
              eq(investorSnapshots.quarter, quarter),
            ),
          );
      }

      // 각 행 처리
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const parsed = this.parseRow(row.raw as any);
          parsedCount++;

          // 국가 코드 검증
          if (parsed.country && !countryMap.has(parsed.country)) {
            // 국가 코드가 없으면 생성
            await this.db.insert(countries).values({
              code: parsed.country,
              nameKo: parsed.city || parsed.country,
              nameEn: parsed.country,
            });
            countryMap.set(parsed.country, parsed.country);
          }

          // 투자자 찾기 또는 생성
          const [investor] = await this.db
            .select()
            .from(investors)
            .where(eq(investors.name, parsed.investorName))
            .limit(1);

          let investorRecord = investor;

          const isParent = !!parsed.rank; // Rank가 있으면 모회사

          if (!investorRecord) {
            // 새 투자자 생성
            [investorRecord] = await this.db
              .insert(investors)
              .values({
                name: parsed.investorName,
                countryCode: parsed.country || null,
                city: parsed.city || null,
                isGroupRepresentative: isParent,
                parentId: null, // TODO: 그룹 매칭 로직 필요
              })
              .returning();
            createdInvestors++;
          }

          // 스냅샷 찾기
          const [existingSnapshot] = await this.db
            .select()
            .from(investorSnapshots)
            .where(
              and(
                eq(investorSnapshots.investorId, investorRecord.id),
                eq(investorSnapshots.year, year),
                eq(investorSnapshots.quarter, quarter),
              ),
            )
            .limit(1);

          const snapshotData = {
            investorId: investorRecord.id,
            year,
            quarter,
            groupRank: parsed.rank || null,
            sOverO: parsed.sOverO,
            ord: parsed.ord,
            adr: parsed.adr,
            investorType: parsed.investorType as any,
            styleTag: parsed.styleTag as any,
            styleNote: parsed.styleNote,
            turnover: parsed.turnover as any,
            orientation: parsed.orientation as any,
            lastActivityAt: parsed.lastActivityAt
              ? new Date(parsed.lastActivityAt)
              : null,
            uploadBatchId: batchId,
          };

          if (existingSnapshot && dto.mode === 'UPSERT') {
            // 업데이트
            const diff = createSnapshotDiff(existingSnapshot, snapshotData);

            if (Object.keys(diff).length > 0) {
              await this.db
                .update(investorSnapshots)
                .set(snapshotData)
                .where(eq(investorSnapshots.id, existingSnapshot.id));

              // 히스토리 기록
              await this.db.insert(investorHistories).values({
                investorId: investorRecord.id,
                year,
                quarter,
                updatedBy: userId,
                changes: diff as any,
              });

              updatedSnapshots++;
              historyCount++;
            }
          } else if (!existingSnapshot || dto.mode === 'APPEND') {
            // 새로 생성
            await this.db.insert(investorSnapshots).values(snapshotData);
            createdSnapshots++;
          }

          // 파싱된 데이터 저장
          await this.db
            .update(gidUploadRows)
            .set({
              parsed: parsed as any,
              mappedInvestorId: investorRecord.id,
            })
            .where(eq(gidUploadRows.id, row.id));
        } catch (error: any) {
          errors.push({
            row: i + 1,
            message: error.message || 'Unknown error',
            data: row.raw,
          });

          // 에러 저장
          await this.db
            .update(gidUploadRows)
            .set({ error: error.message })
            .where(eq(gidUploadRows.id, row.id));
        }
      }

      // 배치 상태 업데이트
      const finalStatus =
        errors.length === rows.length ? 'FAILED' : 'PROCESSED';
      await this.db
        .update(gidUploadBatches)
        .set({
          status: finalStatus,
          processedAt: new Date(),
        })
        .where(eq(gidUploadBatches.id, batchId));

      return {
        uploadBatchId: batchId,
        status: finalStatus,
        result: {
          totalRows: rows.length,
          parsedRows: parsedCount,
          failedRows: errors.length,
          createdInvestors,
          createdSnapshots,
          updatedSnapshots,
          historyRecords: historyCount,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('[GID] processUploadBatch ERROR:', error);
      console.error(
        '[GID] Error stack:',
        error instanceof Error ? error.stack : 'No stack',
      );
      throw error;
    }
  }

  /**
   * 행 파싱 로직
   */
  private parseRow(raw: any): ParsedGidRow {
    // 컬럼명 정규화 (공백, 대소문자 무시)
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, '');

    const keys = Object.keys(raw);
    const getValue = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const normalized = normalize(name);
        const key = keys.find((k) => normalize(k) === normalized);
        if (key !== undefined) {
          const value = raw[key];
          return value === '' || value === null || value === undefined
            ? null
            : value;
        }
      }
      return null;
    };

    const rank = getValue(['rank', 'ranking']);
    const country = getValue(['country', 'countrycode', 'cc']);
    const city = getValue(['city', 'location']);
    const investorName = getValue([
      'investorname',
      'name',
      'investor',
      'company',
    ]);

    if (!investorName) {
      throw new Error('Investor Name is required');
    }

    return {
      rank: rank ? parseInt(String(rank), 10) : null,
      country: country || '',
      city: city || null,
      investorName: String(investorName),
      sOverO: this.parseNumber(getValue(['so', 'soveroo', 's/o'])),
      ord: this.parseNumber(getValue(['ord'])),
      adr: this.parseNumber(getValue(['adr'])),
      investorType: getValue(['investortype', 'type']),
      styleTag: getValue(['styletag', 'style']),
      styleNote: getValue(['stylenote', 'note']),
      turnover: getValue(['turnover']),
      orientation: getValue(['orientation']),
      lastActivityAt: getValue(['lastactivityat', 'lastactivity', 'date']),
    };
  }

  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * 업로드 배치 조회
   */
  async getUploadBatch(batchId: number): Promise<GidUploadBatchResponse> {
    const [batch] = await this.db
      .select()
      .from(gidUploadBatches)
      .where(eq(gidUploadBatches.id, batchId))
      .limit(1);

    if (!batch) {
      throw new NotFoundException(`Upload batch ${batchId} not found`);
    }

    return {
      id: batch.id,
      originalFilename: batch.originalFilename!,
      status: batch.status,
      meta: batch.meta as any,
      uploadedAt: batch.uploadedAt.toISOString(),
      processedAt: batch.processedAt?.toISOString(),
    };
  }

  /**
   * 업로드 행 조회
   */
  async getUploadRows(
    batchId: number,
    page: number = 1,
    pageSize: number = 100,
    onlyErrors: boolean = false,
  ): Promise<GidUploadRowsResponse> {
    const conditions: any[] = [eq(gidUploadRows.batchId, batchId)];

    if (onlyErrors) {
      conditions.push(sql`${gidUploadRows.error} IS NOT NULL`);
    }

    const rows = await this.db
      .select()
      .from(gidUploadRows)
      .where(and(...conditions))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const totalResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(gidUploadRows)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    return {
      uploadBatchId: batchId,
      page,
      pageSize,
      total,
      rows: rows.map((r) => ({
        id: r.id,
        raw: r.raw,
        parsed: r.parsed as any,
        mappedInvestorId: r.mappedInvestorId || undefined,
        error: r.error || undefined,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
}
