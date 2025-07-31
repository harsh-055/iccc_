import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { createHash } from 'crypto';

// In-memory cache for session validation
interface SessionCache {
  userId: string;
  accessToken: string;
  expiresAt: Date;
  lastExtended: Date;
}

@Injectable()
export class SessionService {
    private logger = new Logger(SessionService.name);
    private sessionCache = new Map<string, SessionCache>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly EXTEND_INTERVAL = 15 * 60 * 1000; // Only extend every 15 minutes

    constructor(
        private readonly database: DatabaseService
    ) {
        // Clean up expired cache entries every 5 minutes
        setInterval(() => {
            this.cleanupExpiredCache();
        }, this.CACHE_TTL);
    }

    private cleanupExpiredCache() {
        const now = new Date();
        for (const [cacheKey, session] of this.sessionCache.entries()) {
            if (session.expiresAt < now ||
                (now.getTime() - session.lastExtended.getTime()) > this.CACHE_TTL) {
                this.sessionCache.delete(cacheKey);
            }
        }
    }

    private getCacheKey(userId: string, accessToken: string): string {
        return `${userId}:${createHash('sha256').update(accessToken).digest('hex').substring(0, 16)}`;
    }

    /**
     * Creates a device hash - development-friendly for proxies like ngrok
     */
    private createDeviceHash(userAgent: string, ipAddress: string): string {
        // In development with proxies (like ngrok), use a more stable hash
        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';

        if (isDevelopment) {
            // Use only user-agent for development to avoid IP changes from ngrok
            const stableIdentifier = userAgent || 'development-device';
            return createHash('sha256').update(stableIdentifier).digest('hex');
        }

        // Production: use both user-agent and IP for better security
        const combined = `${userAgent}:${ipAddress}`;
        const hash = createHash('sha256').update(combined).digest('hex');

        return hash;
    }

    /**
     * Create a new session - simplified approach
     */
    async createSession(
        userId: string,
        req: any,
        accessToken: string,
        refreshToken?: string,
        expiresAt?: Date
    ) {
        const deviceHash = this.createDeviceHash(req.headers['user-agent'], req.ip);
        const expirationDate = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        try {
            const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';

            if (isDevelopment) {
                // In development, clean up ALL existing sessions for this user to avoid conflicts
                await this.database.query(
                    `DELETE FROM user_sessions WHERE user_id = $1`,
                    [userId]
                );
                this.logger.log(`Development: Cleaned up all sessions for user ${userId}`);
            } else {
                // In production, only delete sessions with the same token
                await this.database.query(
                    `DELETE FROM user_sessions WHERE user_id = $1 AND access_token = $2`,
                    [userId, accessToken]
                );
            }

            // Create new session
            const result = await this.database.query(
                `INSERT INTO user_sessions 
                 (user_id, device_hash, ip_address, user_agent, access_token, refresh_token, expires_at, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
                 RETURNING *`,
                [
                    userId,
                    deviceHash,
                    req.ip,
                    req.headers['user-agent'],
                    accessToken,
                    refreshToken || '',
                    expirationDate
                ]
            );

            const session = result[0];
            this.logger.log(`New session created for user ${userId}, expires at ${expirationDate}`);
            return session;
        } catch (error) {
            this.logger.error('Error creating session:', error);
            throw error;
        }
    }

    /**
     * Get an active session by user and device
     */
    async getSession(userId: string, req: any) {
        const deviceHash = this.createDeviceHash(req.headers['user-agent'], req.ip);

        try {
            const result = await this.database.query(
                `SELECT * FROM user_sessions 
                 WHERE user_id = $1 AND device_hash = $2`,
                [userId, deviceHash]
            );

            const session = result[0];

            // Check if session is expired
            if (session && new Date(session.expires_at) < new Date()) {
                await this.deleteSession(userId, req);
                return null;
            }

            return session;
        } catch (error) {
            this.logger.error('Error retrieving session:', error);
            return null;
        }
    }

    /**
     * Update session token
     */
    async updateSessionToken(userId: string, req: any, accessToken: string) {
        const deviceHash = this.createDeviceHash(req.headers['user-agent'], req.ip);

        try {
            const result = await this.database.query(
                `UPDATE user_sessions 
                 SET access_token = $1, updated_at = NOW() 
                 WHERE user_id = $2 AND device_hash = $3 
                 RETURNING *`,
                [accessToken, userId, deviceHash]
            );

            return result[0];
        } catch (error) {
            this.logger.error('Error updating session token:', error);
            throw error;
        }
    }

    /**
     * Update entire session with new tokens and expiry
     */
    async updateSession(userId: string, req: any, accessToken: string, refreshToken: string, expiresAt: Date) {
        const deviceHash = this.createDeviceHash(req.headers['user-agent'], req.ip);

        try {
            const result = await this.database.query(
                `UPDATE user_sessions 
                 SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW() 
                 WHERE user_id = $4 AND device_hash = $5 
                 RETURNING *`,
                [accessToken, refreshToken, expiresAt, userId, deviceHash]
            );

            return result[0];
        } catch (error) {
            this.logger.error('Error updating session:', error);
            throw error;
        }
    }

    /**
     * Delete a specific session
     */
    async deleteSession(userId: string, req: any) {
        const deviceHash = this.createDeviceHash(req.headers['user-agent'], req.ip);

        try {
            await this.database.query(
                `DELETE FROM user_sessions 
                 WHERE user_id = $1 AND device_hash = $2`,
                [userId, deviceHash]
            );

            // Clear cache entries for this user
            this.clearUserFromCache(userId);

            this.logger.log(`Session deleted for user ${userId}`);
            return { success: true };
        } catch (error) {
            this.logger.error('Error deleting session:', error);
            return { success: false };
        }
    }

    private clearUserFromCache(userId: string) {
        for (const [cacheKey, session] of this.sessionCache.entries()) {
            if (session.userId === userId) {
                this.sessionCache.delete(cacheKey);
            }
        }
    }

    /**
     * Delete all sessions for a user
     */
    async deleteAllUserSessions(userId: string) {
        try {
            const result = await this.database.query(
                `DELETE FROM user_sessions WHERE user_id = $1`,
                [userId]
            );

            // Clear cache entries for this user
            this.clearUserFromCache(userId);

            this.logger.log(`Deleted ${result.rowCount} sessions for user ${userId}`);
            return { success: true, count: result.rowCount };
        } catch (error) {
            this.logger.error('Error deleting all user sessions:', error);
            return { success: false };
        }
    }

    /**
     * Get all active sessions for a user
     */
    async getAllUserSessions(userId: string) {
        try {
            const sessions = await this.database.query(
                `SELECT id, device_hash, ip_address, user_agent, created_at, updated_at, expires_at
                 FROM user_sessions 
                 WHERE user_id = $1 AND expires_at > NOW()
                 ORDER BY updated_at DESC`,
                [userId]
            );

            return sessions;
        } catch (error) {
            this.logger.error('Error retrieving user sessions:', error);
            return [];
        }
    }

    /**
     * Clean up expired sessions (call this periodically)
     */
    async cleanupExpiredSessions() {
        try {
            const result = await this.database.query(
                `DELETE FROM user_sessions WHERE expires_at < NOW()`
            );

            this.logger.log(`Cleaned up ${result.rowCount} expired sessions`);
            return result.rowCount;
        } catch (error) {
            this.logger.error('Error cleaning up expired sessions:', error);
            return 0;
        }
    }

    /**
     * Verify session exists and is valid - simplified token-only approach
     */
    async verifySession(userId: string, req: any, accessToken: string): Promise<boolean> {
        const startTime = Date.now();
        this.logger.log(`🔍 [${new Date().toISOString()}] Verifying session for user ${userId} | URL: ${req.url}`);
        
        try {
            // Check cache first
            const cacheKey = this.getCacheKey(userId, accessToken);
            const cachedSession = this.sessionCache.get(cacheKey);

            if (cachedSession && cachedSession.expiresAt > new Date()) {
                // Check if cache is still fresh (not older than TTL)
                const now = new Date();
                const cacheAge = now.getTime() - cachedSession.lastExtended.getTime();
                
                if (cacheAge < this.CACHE_TTL) {
                    const duration = Date.now() - startTime;
                    this.logger.log(`⚡ [${new Date().toISOString()}] Session found in cache for user ${userId} | Cache age: ${Math.round(cacheAge/1000)}s | Duration: ${duration}ms | URL: ${req.url}`);
                    return true;
                }
            }

            // Find any session with matching token for this user
            const result = await this.database.query(
                `SELECT * FROM user_sessions 
                 WHERE user_id = $1 AND access_token = $2 
                 LIMIT 1`,
                [userId, accessToken]
            );

            const session = result[0];

            if (!session) {
                this.logger.warn(`❌ [${new Date().toISOString()}] No session found with token for user ${userId} | URL: ${req.url}`);
                // Try to recover session from valid JWT token
                return await this.recoverSessionFromValidToken(userId, req, accessToken);
            }

            // Check if session is expired
            const notExpired = new Date(session.expires_at) > new Date();

            this.logger.log(`🔍 [${new Date().toISOString()}] Session validation: tokenFound=true, notExpired=${notExpired} | URL: ${req.url}`);

            if (!notExpired) {
                this.logger.warn(`❌ [${new Date().toISOString()}] Session expired for user ${userId}, expires at ${session.expires_at} | URL: ${req.url}`);
                // Clean up expired session
                await this.database.query(
                    `DELETE FROM user_sessions WHERE id = $1`,
                    [session.id]
                );
                this.sessionCache.delete(cacheKey);
                return false;
            }

            // Check if we should extend session (only if more than 15 minutes since last extension)
            const now = new Date();
            const shouldExtend = !session.updated_at || 
                (now.getTime() - new Date(session.updated_at).getTime()) > this.EXTEND_INTERVAL;

            let newExpiryDate = new Date(session.expires_at);

            if (shouldExtend) {
                // Session is valid, extend expiry by 24 hours for active usage
                newExpiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await this.database.query(
                    `UPDATE user_sessions 
                     SET expires_at = $1, updated_at = NOW() 
                     WHERE id = $2`,
                    [newExpiryDate, session.id]
                );
                this.logger.log(`⏰ [${new Date().toISOString()}] Session extended for user: ${userId} | URL: ${req.url}`);
            } else {
                this.logger.log(`✅ [${new Date().toISOString()}] Session validated (not extended) for user: ${userId} | URL: ${req.url}`);
            }

            // Update cache
            this.sessionCache.set(cacheKey, {
                userId,
                accessToken,
                expiresAt: newExpiryDate,
                lastExtended: new Date()
            });

            const duration = Date.now() - startTime;
            this.logger.log(`✅ [${new Date().toISOString()}] Session validated for user: ${userId} | Duration: ${duration}ms | URL: ${req.url}`);

            return true;

        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`❌ [${new Date().toISOString()}] Error verifying session: ${error.message} | Duration: ${duration}ms | URL: ${req.url}`);
            return false;
        }
    }

    /**
     * Recover session from a valid JWT token when database session is missing
     */
    private async recoverSessionFromValidToken(userId: string, req: any, accessToken: string): Promise<boolean> {
        try {
            this.logger.log(`Attempting to recover session from valid JWT for user ${userId}`);

            // Create a new session record with 24 hour expiry
            const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await this.createSession(userId, req, accessToken, '', expirationDate);

            this.logger.log(`Session recovered and recreated for user ${userId}`);
            return true;

        } catch (error) {
            this.logger.error(`Failed to recover session for user ${userId}:`, error);
            return false;
        }
    }

    /**
     * Extend session expiry - simplified approach (extends most recent session)
     */
    async extendSession(userId: string, req: any, additionalHours: number = 24) {
        const newExpiryDate = new Date(Date.now() + additionalHours * 60 * 60 * 1000);

        try {
            // Find the most recent active session for this user
            const result = await this.database.query(
                `SELECT * FROM user_sessions 
                 WHERE user_id = $1 AND expires_at > NOW()
                 ORDER BY updated_at DESC 
                 LIMIT 1`,
                [userId]
            );

            const session = result[0];

            if (!session) {
                this.logger.warn(`No active session found to extend for user ${userId}`);
                return null;
            }

            const updateResult = await this.database.query(
                `UPDATE user_sessions 
                 SET expires_at = $1, updated_at = NOW() 
                 WHERE id = $2 
                 RETURNING *`,
                [newExpiryDate, session.id]
            );

            return updateResult[0];
        } catch (error) {
            this.logger.error('Error extending session:', error);
            throw error;
        }
    }
}