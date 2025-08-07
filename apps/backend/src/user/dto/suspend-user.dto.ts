import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuspendUserDto {
  @ApiProperty({
    description: 'Reason for suspending the user (for internal records)',
    required: false,
    example: 'User requested account suspension',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
