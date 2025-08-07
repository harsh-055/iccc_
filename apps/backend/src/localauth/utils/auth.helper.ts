// import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { JWTService } from 'src/utils/jwt/jwt.service';
// import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { MfaService } from './mfa.service';

// Stub Redis service for when Redis is disabled
class StubRedisService {
  async get(key: string): Promise<string | null> {
    return null;
  }
  async set(key: string, value: string, ...args: any[]): Promise<void> {}
  async del(...keys: string[]): Promise<number> {
    return 0;
  }
  async keys(pattern: string): Promise<string[]> {
    return [];
  }
}

@Injectable()
export class AuthHelper {
  private logger = new Logger(AuthHelper.name);
  private redisService = new StubRedisService(); // Stub for when Redis is disabled

  constructor(
    private readonly jwtUtil: JWTService,
    // @InjectRedis() private readonly redisService: Redis,
    private mfaService: MfaService,
  ) {}

  /**
   * Generates Access & Refresh Tokens while tracking session info in Redis.
   */
  async generateTokens(user: any, req: any) {
    const userId = user.id;
    const sessionId = randomUUID();
    // let sessions = await this.getAllActiveSessions(userId)
    // // console.log(sessions)
    // for(let session of sessions){
    //    if(session.device === req.headers['user-agent'] && session.ip === req.ip)
    //         this.logger.log('Reusing existing session')
    //         const refreshToken:any = await this.redisService.get(`refresh:${userId}:${session.sessionId}`);
    //         let refreshTokenDecoded = JSON.parse(refreshToken)
    //       return {
    //         accessToken: session.token,
    //         refreshToken: refreshTokenDecoded?.token,
    //     }
    // }
    // Check if there is an existing session with the same IP and device
    // const currentSession = await this.redisService.get(`session:${userId}:${sessionId}`);
    // const currentRefreshToken = await this.redisService.get(`refresh:${userId}:${sessionId}`);
    const sessionInfo = {
      ip: req.ip,
      device: req.headers['user-agent'],
      loggedInAt: new Date().toISOString(),
      sessionId: sessionId,
    };

    // If an active session exists and matches, return the existing token
    // if (currentSession && currentRefreshToken) {
    //     const storedSession = JSON.parse(currentSession);
    //     const storedRefreshToken = JSON.parse(currentRefreshToken);
    //     if (storedSession.ip === sessionInfo.ip && storedSession.device === sessionInfo.device) {
    //         this.logger.log('Reusing existing session')
    //         return {
    //             accessToken: storedSession.token,
    //             refreshToken: storedRefreshToken.token, // Get stored refresh token
    //         };
    //     }
    // }
    user['sessionId'] = sessionId;
    // If session does not exist or device/IP mismatch, generate new tokens
    const accessToken = this.jwtUtil.generateAccessToken(
      user,
      '15m',
      true,
      req,
    );
    const refreshToken = this.jwtUtil.generateRefreshToken(user);

    // Store new session in Redis (override old one) - DISABLED
    sessionInfo['token'] = accessToken; // Attach the new token
    // await this.redisService.set(`session:${userId}:${sessionId}`, JSON.stringify(sessionInfo), 'EX', 900); // 15 mins expiry
    const refreshTokenInfo = {
      token: refreshToken,
      ip: req.ip,
      device: req.headers['user-agent'],
      createdAt: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
      sessionId,
    };
    // await this.redisService.set(`refresh:${userId}:${sessionId}`, JSON.stringify(refreshTokenInfo), 'EX', 604800); // 7 days expiry

    return { accessToken, refreshToken: refreshToken };
  }

  /**
   * Validates Access Token & Retrieves User Session.
   */
  async validateAccessToken(req, token: string) {
    try {
      const decoded = this.jwtUtil.verifyAccessToken(token);
      console.log(decoded);
      // const session = await this.redisService.get(`session:${decoded.id}:${decoded.sessionId}`);

      // if (!session) {
      //     throw new Error('Session expired or invalid');
      // }

      // const decodedSession = JSON.parse(session);
      // if (decodedSession.token !== token) {
      //     throw new Error('Token mismatch');
      // }

      // if (decodedSession.ip !== req.ip) {
      //     console.log(decodedSession.ip, req.ip)
      //     throw new Error('IP mismatch');
      // }

      return decoded;
    } catch (err) {
      console.log(err);
      throw new Error('Invalid access token');
    }
  }

  /**
   * Activates 2FA for a user.
   */
  async generateMfaSecret(userId: string) {
    return await this.mfaService.generateSecret(userId);
  }

  async verifyMfaToken(secret: string, token: string) {
    return this.mfaService.verifyToken(secret, token);
  }

  /**
   * Validates Refresh Token & Returns New Access Token.
   */
  async refreshAccessToken(refreshToken: string, req: any) {
    try {
      const user = req.user;
      const decoded = this.jwtUtil.verifyRefreshToken(refreshToken);
      const sessionData = await this.redisService.get(
        `refresh:${user.id}:${decoded.sessionId}`,
      );
      if (!sessionData) {
        throw new Error('Invalid or expired refresh token');
      }

      // Parse session data from Redis
      const session = JSON.parse(sessionData);
      if (session.ip !== req.ip) {
        throw new Error('IP mismatch');
      }
      if (session.device !== req.headers['user-agent']) {
        this.logger.error(session.device, req.headers['user-agent']);
        throw new Error('User-Agent mismatch');
      }
      if (session.token !== refreshToken) {
        throw new Error('Token mismatch');
      }
      // Generate new access token
      if (user.iat) delete user.iat;
      if (user.exp) delete user.exp;
      const newAccessToken = this.jwtUtil.generateAccessToken(
        user,
        '15m',
        true,
        req,
      );
      session.token = newAccessToken;
      await this.redisService.del(`session:${user.id}:${decoded.sessionId}`);
      await this.redisService.set(
        `session:${user.id}:${decoded.sessionId}`,
        JSON.stringify(session),
        'EX',
        900,
      ); // 15 mins expiry

      return { accessToken: newAccessToken };
    } catch (err) {
      console.log(err.stack);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logs out by deleting session & refresh token from Redis.
   */
  async logout(req) {
    const userId = req.user.id;
    // let session = this.redisService.get(`session:${userId}`);
    // let refreshSession = this.redisService.get(`refresh:${userId}`);
    await this.redisService.del(`session:${userId}:${req.sessionId}`);
    await this.redisService.del(`refresh:${userId}:${req.sessionId}`);

    // Remove the specific device from the session list
    // let devices = await this.getActiveDevices(userId);
    // devices = devices.filter(device => device.token !== accessToken);
    // await this.redisService.set(`devices:${userId}`, JSON.stringify(devices), 'EX', 604800);

    return { message: 'Logged out successfully' };
  }

  async getAllActiveSessions(userId: string): Promise<any> {
    try {
      // Get all keys matching the user's session pattern
      const keys = await this.redisService.keys(`session:${userId}:*`);

      if (keys.length === 0) {
        return [];
      }

      // Fetch all session details from Redis
      const sessions = await Promise.all(
        keys.map(async (key) => {
          const sessionData = await this.redisService.get(key);
          return sessionData ? JSON.parse(sessionData) : null;
        }),
      );

      // Filter out null values (in case of deleted sessions)
      const activeSessions = sessions.filter((session) => session !== null);

      return activeSessions;
    } catch (error) {
      this.logger.error('Error retrieving active sessions', error);
      throw new Error('Failed to retrieve active sessions');
    }
  }

  /**
   * Logs out all devices by clearing all sessions for a user.
   */
  async logoutAll(userId: string) {
    const devices = await this.getActiveDevices(userId);
    for (const device of devices) {
      await this.redisService.del(`session:${userId}:${device.token}`);
    }
    await this.redisService.del(`devices:${userId}`);
    return { message: 'Logged out from all devices' };
  }

  /**
   * Retrieves all active devices for a user.
   */
  async getActiveDevices(userId: string): Promise<any[]> {
    const devicesData = await this.redisService.get(`devices:${userId}`);
    return devicesData ? JSON.parse(devicesData) : [];
  }

  async sendMFA(req: any, userId: any, type: any) {
    throw new Error('Method not implemented.');
  }

  async sendVerificationSMS(phoneNumber: string, code: string) {
    throw new Error('Method not implemented.');
  }
  async sendVerificationEmail(email: string, code: string) {
    throw new Error('Method not implemented.');
  }
  async initAuthenticator(userId: string) {
    throw new Error('Method not implemented.');
  }
}
