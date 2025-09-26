import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
	IsBoolean,
	IsDateString,
	IsEnum,
	IsOptional,
	IsString,
	IsUUID,
} from "class-validator";

export enum CalendarEventStatusDtoEnum {
	CONFIRMED = "CONFIRMED",
	TENTATIVE = "TENTATIVE",
	CANCELLED = "CANCELLED",
}

export enum CalendarEventTypeDtoEnum {
	MEETING = "MEETING",
	CALL = "CALL",
	TASK = "TASK",
	REMINDER = "REMINDER",
	OTHER = "OTHER",
}

export class CreateCalendarEventDto {
	@ApiProperty({ description: "제목", example: "미팅유형" })
	@IsString()
	title!: string;

	@ApiPropertyOptional({ description: "설명", example: "회의 상세 메모" })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({ description: "시작일시(ISO)", example: "2025-09-10T09:00:00" })
	@IsDateString()
	startAt!: string;

	@ApiProperty({ description: "종료일시(ISO)", example: "2025-09-10T10:00:00" })
	@IsDateString()
	endAt!: string;

	@ApiPropertyOptional({ description: "종일 여부", default: false })
	@IsOptional()
	@IsBoolean()
	allDay?: boolean;

	@ApiPropertyOptional({ description: "위치", example: "회의실 A" })
	@IsOptional()
	@IsString()
	location?: string;

	@ApiPropertyOptional({
		enum: CalendarEventStatusDtoEnum,
		default: CalendarEventStatusDtoEnum.CONFIRMED,
	})
	@IsOptional()
	@IsEnum(CalendarEventStatusDtoEnum)
	status?: CalendarEventStatusDtoEnum;

	@ApiPropertyOptional({
		enum: CalendarEventTypeDtoEnum,
		default: CalendarEventTypeDtoEnum.MEETING,
	})
	@IsOptional()
	@IsEnum(CalendarEventTypeDtoEnum)
	eventType?: CalendarEventTypeDtoEnum;
}

export class UpdateCalendarEventDto {
	@ApiPropertyOptional({ description: "제목" })
	@IsOptional()
	@IsString()
	title?: string;

	@ApiPropertyOptional({ description: "설명" })
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({ description: "시작일시(ISO)" })
	@IsOptional()
	@IsDateString()
	startAt?: string;

	@ApiPropertyOptional({ description: "종료일시(ISO)" })
	@IsOptional()
	@IsDateString()
	endAt?: string;

	@ApiPropertyOptional({ description: "종일 여부" })
	@IsOptional()
	@IsBoolean()
	allDay?: boolean;

	@ApiPropertyOptional({ description: "위치" })
	@IsOptional()
	@IsString()
	location?: string;

	@ApiPropertyOptional({ enum: CalendarEventStatusDtoEnum })
	@IsOptional()
	@IsEnum(CalendarEventStatusDtoEnum)
	status?: CalendarEventStatusDtoEnum;

	@ApiPropertyOptional({ enum: CalendarEventTypeDtoEnum })
	@IsOptional()
	@IsEnum(CalendarEventTypeDtoEnum)
	eventType?: CalendarEventTypeDtoEnum;
}

export class QueryCalendarRangeDto {
	@ApiProperty({
		description: "조회 시작(ISO date or datetime)",
		example: "2025-09-01",
	})
	@IsDateString()
	from!: string;

	@ApiProperty({
		description: "조회 종료(ISO date or datetime)",
		example: "2025-09-30",
	})
	@IsDateString()
	to!: string;

	@ApiPropertyOptional({ description: "소유자 UUID" })
	@IsOptional()
	@IsUUID()
	ownerId?: string;

	@ApiPropertyOptional({ enum: CalendarEventStatusDtoEnum })
	@IsOptional()
	@IsEnum(CalendarEventStatusDtoEnum)
	status?: CalendarEventStatusDtoEnum;

	@ApiPropertyOptional({ enum: CalendarEventTypeDtoEnum })
	@IsOptional()
	@IsEnum(CalendarEventTypeDtoEnum)
	eventType?: CalendarEventTypeDtoEnum;
}
