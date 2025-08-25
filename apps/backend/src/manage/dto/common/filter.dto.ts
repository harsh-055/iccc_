import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsUUID, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class BaseFilterDto {
  @ApiProperty({
    description: 'Filter by active status',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by tenant ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null' || value === 'uuid-string') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'tenantId must be a valid UUID' })
  tenantId?: string;

  @ApiProperty({
    description: 'Filter by region ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'regionId must be a valid UUID' })
  regionId?: string;

  @ApiProperty({
    description: 'Filter by zone ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'zoneId must be a valid UUID' })
  zoneId?: string;

  @ApiProperty({
    description: 'Filter by ward ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'wardId must be a valid UUID' })
  wardId?: string;

  @ApiProperty({
    description: 'Filter by workforce type ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'workforceTypeId must be a valid UUID' })
  workforceTypeId?: string;

  @ApiProperty({
    description: 'Filter by assigned site ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'assignedSiteId must be a valid UUID' })
  assignedSiteId?: string;

  @ApiProperty({
    description: 'Filter by assigned region ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'assignedRegionId must be a valid UUID' })
  assignedRegionId?: string;

  @ApiProperty({
    description: 'Filter by assigned zone ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'assignedZoneId must be a valid UUID' })
  assignedZoneId?: string;

  @ApiProperty({
    description: 'Filter by assigned ward ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'assignedWardId must be a valid UUID' })
  assignedWardId?: string;

  @ApiProperty({
    description: 'Filter by category',
    example: 'Equipment',
    required: false,
  })
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Filter by status',
    example: 'Active',
    required: false,
  })
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Filter by created by user ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'createdBy must be a valid UUID' })
  createdBy?: string;
}
