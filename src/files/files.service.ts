import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export interface UploadedFileInfo {
	id: string;
	filename: string;
	url: string;
	size: number;
	contentType: string | null;
	meta: Record<string, unknown>;
}

@Injectable()
export class FilesService {
	private supabase: SupabaseClient | null = null;
	private bucket: string | null = null;
	private hasServiceRole = false;
	private bucketReady = false;

	constructor(private readonly config: ConfigService) {}

	private ensureClient(): SupabaseClient {
		if (this.supabase) return this.supabase;
		const url = this.config.get<string>("SUPABASE_URL");
		const key =
			this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY") ??
			this.config.get<string>("SUPABASE_ANON_KEY");
		if (!url || !key) {
			throw new InternalServerErrorException(
				"Supabase credentials are not configured",
			);
		}
		this.bucket =
			this.config.get<string>("SUPABASE_STORAGE_BUCKET") ?? "uploads";
		this.supabase = createClient(url, key);
		this.hasServiceRole = !!this.config.get<string>(
			"SUPABASE_SERVICE_ROLE_KEY",
		);
		return this.supabase;
	}

	private async ensureBucketExists(client: SupabaseClient, bucket: string) {
		if (this.bucketReady) return;
		if (!this.hasServiceRole) return; // cannot manage buckets without service role
		const { data, error } = await client.storage.getBucket(bucket);
		if (!data || error) {
			const { error: createErr } = await client.storage.createBucket(bucket, {
				public: true,
			});
			if (createErr) {
				throw new InternalServerErrorException(
					`Failed to create storage bucket '${bucket}': ${createErr.message}`,
				);
			}
		}
		this.bucketReady = true;
	}

	async uploadBuffer(file: {
		buffer: Buffer;
		originalname: string;
		mimetype?: string;
		size: number;
	}): Promise<UploadedFileInfo> {
		try {
			const ext = file.originalname.split(".").pop();
			const id = randomUUID();
			const path = `${id}${ext ? "." + ext : ""}`;
			const contentType = file.mimetype ?? "application/octet-stream";

			const supabase = this.ensureClient();
			const bucket = this.bucket ?? "uploads";
			await this.ensureBucketExists(supabase, bucket);
			const { error } = await supabase.storage
				.from(bucket)
				.upload(path, file.buffer, {
					contentType,
					upsert: false,
				});

			if (error) {
				const msg = error.message ?? "";
				if (/not\s*found/i.test(msg) && !this.hasServiceRole) {
					throw new InternalServerErrorException(
						`Upload failed: Bucket '${bucket}' not found. ` +
							`Create the bucket in Supabase Storage or set SUPABASE_STORAGE_BUCKET to an existing bucket. ` +
							`If you prefer auto-creation, provide SUPABASE_SERVICE_ROLE_KEY on the server.`,
					);
				}
				throw new InternalServerErrorException("Upload failed: " + msg);
			}

			const { data: publicUrlData } = supabase.storage
				.from(bucket)
				.getPublicUrl(path);

			const url = publicUrlData.publicUrl;

			return {
				id,
				filename: file.originalname,
				url,
				size: file.size,
				contentType,
				meta: {},
			} satisfies UploadedFileInfo;
		} catch (e) {
			if (e instanceof InternalServerErrorException) throw e;
			throw new InternalServerErrorException("Unexpected upload error");
		}
	}
}
