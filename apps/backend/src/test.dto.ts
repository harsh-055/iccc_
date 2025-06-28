import { z } from 'zod';

// Define Zod schema
export const TestSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
  age: z.number(),
});

// DTO with schema reference
export class CreateUserDto {
  static schema = TestSchema; // Attach schema to DTO
}