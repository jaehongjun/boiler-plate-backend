import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe<TOutput>
  implements PipeTransform<unknown, TOutput>
{
  constructor(private readonly schema: ZodSchema<TOutput>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): TOutput {
    void _metadata;
    try {
      return this.schema.parse(value);
    } catch (unknownError: unknown) {
      if (unknownError instanceof ZodError) {
        const errorMessages = unknownError.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errorMessages,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
