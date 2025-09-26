export type CalendarEventStatus = "CONFIRMED" | "TENTATIVE" | "CANCELLED";
export type CalendarEventType =
	| "MEETING"
	| "CALL"
	| "TASK"
	| "REMINDER"
	| "OTHER";

export interface CalendarEvent {
	eventId: number;
	ownerId: string | null;
	updatedBy?: string | null;
	title: string;
	description: string | null;
	eventType: CalendarEventType | null;
	startAt: Date;
	endAt: Date;
	allDay: boolean;
	location: string | null;
	status: CalendarEventStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface CalendarEventHistoryRecord {
	historyId: number;
	eventId: number;
	action: "CREATE" | "UPDATE" | "DELETE";
	changedBy: string | null;
	changedAt: Date;
	before: unknown;
	after: unknown;
}
