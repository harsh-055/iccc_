import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Ensure the target type has a Zod schema
    if (!metadata.metatype || !('schema' in metadata.metatype)) {
      return value; // No validation if no schema is defined
    }

    const schema: ZodSchema<any> = (metadata.metatype as any).schema;
    const result = schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }

    return result.data;
  }
}