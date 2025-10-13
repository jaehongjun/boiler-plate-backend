import { Injectable } from "@nestjs/common";

export interface Attachment {
	id?: string;
	filename: string;
	url: string;
}

export interface IrActivity {
	id: number;
	title: string;
	type: string;
	meetingAt?: string;
	place?: string;
	broker?: string;
	brokerPerson?: string;
	investor?: string;
	investorPerson?: string;
	attachments: Attachment[];
}

@Injectable()
export class IrService {
	private seq = 100;
	private items: IrActivity[] = [];

	create(data: Omit<IrActivity, "id">): IrActivity {
		const id = ++this.seq;
		const item: IrActivity = { id, ...data };
		this.items.unshift(item);
		return item;
	}
}
