import { z } from 'zod';

// Attachment upload response
export const attachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  storageUrl: z.string().optional(),
  uploadedBy: z.string().uuid().optional(),
  uploadedAt: z.string().datetime(),
});

export type AttachmentDto = z.infer<typeof attachmentSchema>;

// File size constraints
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB per file
  MAX_TOTAL_SIZE: 500 * 1024 * 1024, // 500MB per activity
  ALLOWED_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ],
} as const;
