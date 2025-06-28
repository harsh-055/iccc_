import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JWTService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly privateKey: string | null;
  private readonly publicKey: string | null;

  constructor(private readonly configService: ConfigService) {
    this.accessSecret = this.configService.get<string>('JWT_SECRET', 'default_secret');
    this.refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'default_refresh_secret');

    // Load RSA keys if available
    const privateKeyPath = path.resolve(__dirname, '../../keys/private.key');
    const publicKeyPath = path.resolve(__dirname, '../../keys/public.key');

    this.privateKey = fs.existsSync(privateKeyPath) ? fs.readFileSync(privateKeyPath, 'utf8') : null;
    this.publicKey = fs.existsSync(publicKeyPath) ? fs.readFileSync(publicKeyPath, 'utf8') : null;
  }

  /**
   * Generates an access token with optional device binding.
   * @param payload - The data to encode in the JWT.
   * @param expiresIn - Expiry time for the token (default: 15m).
   * @param bindDevice - Whether to bind token to IP/Device.
   * @param req - Request object for IP/Device binding.
   */
  generateAccessToken(payload: Record<string, any>, expiresIn = '15m', bindDevice = false, req?: any): string {
    const data = { ...payload };
    if (bindDevice && req) {
      data.ip = req.ip;
      data.device = req.headers['user-agent'];
    }

    return jwt.sign(data, this.accessSecret, { expiresIn });
  }

  /**
   * Generates a refresh token.
   * @param payload - The data to encode in the JWT.
   * @param expiresIn - Expiry time for the token (default: 7d).
   */
  generateRefreshToken(payload: Record<string, any>, expiresIn = '7d'): string {
    return jwt.sign(payload, this.refreshSecret, { expiresIn });
  }

  /**
   * Verifies an access token.
   * @param token - The JWT token to verify.
   */
  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.accessSecret);
    } catch (err) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verifies a refresh token.
   * @param token - The JWT refresh token to verify.
   */
  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.refreshSecret);
    } catch (err) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generates a JWT using RSA private key (if available).
   * @param payload - The payload data.
   * @param expiresIn - Expiry time for the token.
   */
  generateTokenWithRSA(payload: Record<string, any>, expiresIn = '15m'): string {
    if (!this.privateKey) throw new Error('RSA Private Key not found');
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn,
    });
  }

  /**
   * Verifies a JWT using RSA public key (if available).
   * @param token - The token to verify.
   */
  verifyTokenWithRSA(token: string): any {
    if (!this.publicKey) throw new Error('RSA Public Key not found');
    return jwt.verify(token, this.publicKey, {
      algorithms: ['RS256'],
    });
  }
}
