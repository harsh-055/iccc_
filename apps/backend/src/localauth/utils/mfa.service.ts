import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class MfaService {
  async generateSecret(sec: string) {
    const secret = speakeasy.generateSecret({ name: `MyApp-TWOFACTORAUTH (${sec})` });
    return {
      secret: secret.base32,
      qrCode: await qrcode.toDataURL(secret.otpauth_url),
    };
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
    });
  }
}
