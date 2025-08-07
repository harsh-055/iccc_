import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;

  @IsString()
  LENSCLOUD_API: string;

  @IsString()
  LENS_SMS_URL: string;

  @IsString()
  LENS_MAIL_URL: string;

  @IsString()
  LENS_WHATSAPP_URL: string;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  LENS_VERIFICATION_MAIL_URL: string;

  @IsString()
  LENS_VERIFICATION_SMS_URL: string;

  @IsString()
  LENS_VERIFICATION_WHATSAPP_URL: string;

  @IsString()
  LENS_VERIFY_MAIL_URL: string;

  @IsString()
  LENS_VERIFY_SMS_URL: string;

  @IsString()
  LENS_VERIFY_WHATSAPP_URL: string;

  @IsString()
  JWT_SECRET: string;

  // @IsString()
  // CORS_ORIGIN?: string;

  // Redis Configuration (COMMENTED OUT)
  // @IsString()
  // REDIS_HOST: string;

  // @IsNumber()
  // @Min(0)
  // @Max(65535)
  // REDIS_PORT: number;

  // @IsString()
  // REDIS_PASSWORD?: string;

  // @IsString()
  // REDIS_URL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
