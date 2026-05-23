import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { type ZodSchema } from 'zod';
import { ValidationException } from '../exceptions/domain.exceptions';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    void _metadata;
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const message = result.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw new ValidationException(message, 'ZodValidationPipe');
    }
    return result.data;
  }
}
