import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export class CreateUserDto extends createZodDto(
  z.object({
    username: z.string().min(3),
    password: z.string().min(6),
  }),
) {}
