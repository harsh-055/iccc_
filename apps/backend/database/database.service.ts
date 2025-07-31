// import { Injectable, OnModuleDestroy } from '@nestjs/common';
// import { Pool, QueryResult } from 'pg';
// import createSubscriber from 'pg-listen';
// import { EventEmitter } from 'events';

// type DatabaseParam = string | number | boolean | null | string[] | number[] | Date;

// export interface RealtimePayload {
//   table: string;
//   action: 'INSERT' | 'UPDATE' | 'DELETE';
//   data: any;
//   oldData?: any;
//   timestamp: Date;
//   truncated?: boolean;
// }

// @Injectable()
// export class DatabaseService implements OnModuleDestroy {
//   private pool: Pool;
//   private subscriber: any;
//   private realtimeEmitter: EventEmitter;

//   constructor() {
//     this.pool = new Pool({
//       connectionString: process.env.DATABASE_URL,
//     });
    
//     this.realtimeEmitter = new EventEmitter();
//     this.initializeRealtime();
//   }

//   private async initializeRealtime() {
//     console.log('🔄 Initializing realtime in DatabaseService...');

//     this.subscriber = createSubscriber({
//       connectionString: process.env.DATABASE_URL,
//     });

//     this.subscriber.notifications.on('data_change', (payload: any) => {
//           console.log('📡 DatabaseService received notification:', JSON.stringify(payload, null, 2));

//       try {
//         // const parsedPayload = JSON.parse(payload);
//         this.realtimeEmitter.emit('change', payload);
//         this.realtimeEmitter.emit(`change:${payload.table}`, payload);
//         console.log('✅ Emitted to internal event emitter');

//       } catch (error) {
//         console.error('Error parsing realtime payload:', error);
//       }
//     });

//     this.subscriber.events.on('error', (error: Error) => {
//       console.error('Realtime connection error:', error);
//     });

//     try {
//       await this.subscriber.connect();
//       await this.subscriber.listenTo('data_change');
//       console.log('✅ Realtime service connected');
//     } catch (error) {
//       console.error('Failed to initialize realtime:', error);
//     }
//   }

//   async query<T = any>(text: string, params?: DatabaseParam[]): Promise<QueryResult<T>> {
//     return this.pool.query<T>(text, params);
//   }

//   // Realtime management methods
//   async enableRealtimeForTable(tableName: string): Promise<void> {
//     await this.query('SELECT add_realtime_trigger($1)', [tableName]);
//     await this.query(
//       'INSERT INTO realtime_enabled_tables (table_name) VALUES ($1) ON CONFLICT DO NOTHING',
//       [tableName]
//     );
//   }

//   async disableRealtimeForTable(tableName: string): Promise<void> {
//     await this.query('SELECT remove_realtime_trigger($1)', [tableName]);
//     await this.query('DELETE FROM realtime_enabled_tables WHERE table_name = $1', [tableName]);
//   }

//   async getRealtimeEnabledTables(): Promise<string[]> {
//     const result = await this.query<{ table_name: string }>(
//       'SELECT table_name FROM realtime_enabled_tables'
//     );
//     return result.rows.map(row => row.table_name);
//   }

//   // Subscribe to realtime changes
//   onRealtimeChange(callback: (payload: RealtimePayload) => void): () => void;
//   onRealtimeChange(table: string, callback: (payload: RealtimePayload) => void): () => void;
//   onRealtimeChange(
//     tableOrCallback: string | ((payload: RealtimePayload) => void),
//     callback?: (payload: RealtimePayload) => void
//   ): () => void {
//     if (typeof tableOrCallback === 'string') {
//       const table = tableOrCallback;
//       this.realtimeEmitter.on(`change:${table}`, callback);
//       return () => this.realtimeEmitter.off(`change:${table}`, callback);
//     } else {
//       this.realtimeEmitter.on('change', tableOrCallback);
//       return () => this.realtimeEmitter.off('change', tableOrCallback);
//     }
//   }

//   async onModuleDestroy() {
//     await this.subscriber?.close();
//     await this.pool.end();
//   }



//   async getClient() {
//   const client = await this.pool.connect();
//   return {
//     client,
//     release: () => client.release(),
//     query: <T = any>(text: string, params?: DatabaseParam[]): Promise<QueryResult<T>> =>
//       client.query<T>(text, params),
//     begin: () => client.query('BEGIN'),
//     commit: () => client.query('COMMIT'),
//     rollback: () => client.query('ROLLBACK'),
//   };
// }
// }

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import createSubscriber from 'pg-listen';
import { EventEmitter } from 'events';

type DatabaseParam = string | number | boolean | null | string[] | number[] | Date;

export interface RealtimePayload {
  notification_id?: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  oldData?: any;
  timestamp: Date;
  truncated?: boolean;
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;
  private subscriber: any;
  private realtimeEmitter: EventEmitter;
  private processedNotifications = new Map<string, number>();
  private readonly DEDUP_WINDOW_MS = 1000; // 1 second deduplication window

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    this.realtimeEmitter = new EventEmitter();
    this.initializeRealtime();
    
    // Clean up old processed notifications every minute
    setInterval(() => {
      this.cleanupProcessedNotifications();
    }, 60000);
  }

  private cleanupProcessedNotifications() {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.processedNotifications.forEach((timestamp, key) => {
      if (now - timestamp > this.DEDUP_WINDOW_MS * 2) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.processedNotifications.delete(key));
  }

  private async initializeRealtime() {
    console.log('🔄 Initializing realtime in DatabaseService...');
    this.subscriber = createSubscriber({
      connectionString: process.env.DATABASE_URL,
    });

    this.subscriber.notifications.on('data_change', (payload: any) => {
      try {
        // Check for duplicate notifications
        if (this.isDuplicateNotification(payload)) {
          console.log('⚠️  Skipping duplicate notification');
          return;
        }

        console.log('📡 DatabaseService received notification:', JSON.stringify(payload, null, 2));
        
        this.realtimeEmitter.emit('change', payload);
        this.realtimeEmitter.emit(`change:${payload.table}`, payload);
        console.log('✅ Emitted to internal event emitter');
      } catch (error) {
        console.error('Error parsing realtime payload:', error);
      }
    });

    this.subscriber.events.on('error', (error: Error) => {
      console.error('Realtime connection error:', error);
    });

    try {
      await this.subscriber.connect();
      await this.subscriber.listenTo('data_change');
      console.log('✅ Realtime service connected');
      
      // Log connection info for debugging
      const connectionInfo = await this.query(`
        SELECT 
          client_addr,
          application_name,
          backend_start,
          state
        FROM pg_stat_activity 
        WHERE datname = current_database()
          AND application_name LIKE '%node%'
      `);
      
      console.log(`📊 Active database connections: ${connectionInfo.rows.length}`);
    } catch (error) {
      console.error('Failed to initialize realtime:', error);
    }
  }

  private isDuplicateNotification(payload: RealtimePayload): boolean {
    const now = Date.now();
    
    // Create a unique key for this notification
    let notificationKey: string;
    
    if (payload.notification_id) {
      // Use the notification_id if available (from updated trigger)
      notificationKey = payload.notification_id;
    } else {
      // Fallback to creating a key from payload data
      const dataId = payload.data?.id || 'no-id';
      notificationKey = `${payload.table}-${payload.action}-${dataId}-${payload.timestamp}`;
    }
    
    const lastProcessed = this.processedNotifications.get(notificationKey);
    
    if (lastProcessed && (now - lastProcessed) < this.DEDUP_WINDOW_MS) {
      return true; // It's a duplicate
    }
    
    this.processedNotifications.set(notificationKey, now);
    return false;
  }

  async query<T = any>(text: string, params?: DatabaseParam[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  // Realtime management methods
  async enableRealtimeForTable(tableName: string): Promise<void> {
    await this.query('SELECT add_realtime_trigger($1)', [tableName]);
    await this.query(
      'INSERT INTO realtime_enabled_tables (table_name) VALUES ($1) ON CONFLICT DO NOTHING',
      [tableName]
    );
  }

  async disableRealtimeForTable(tableName: string): Promise<void> {
    await this.query('SELECT remove_realtime_trigger($1)', [tableName]);
    await this.query('DELETE FROM realtime_enabled_tables WHERE table_name = $1', [tableName]);
  }

  async getRealtimeEnabledTables(): Promise<string[]> {
    const result = await this.query<{ table_name: string }>(
      'SELECT table_name FROM realtime_enabled_tables'
    );
    return result.rows.map(row => row.table_name);
  }

  // Check for duplicate triggers (for debugging)
  async checkDuplicateTriggers(): Promise<any[]> {
    const result = await this.query(`
      SELECT * FROM check_duplicate_triggers()
    `);
    return result.rows;
  }

  // Subscribe to realtime changes
  onRealtimeChange(callback: (payload: RealtimePayload) => void): () => void;
  onRealtimeChange(table: string, callback: (payload: RealtimePayload) => void): () => void;
  onRealtimeChange(
    tableOrCallback: string | ((payload: RealtimePayload) => void),
    callback?: (payload: RealtimePayload) => void
  ): () => void {
    if (typeof tableOrCallback === 'string') {
      const table = tableOrCallback;
      this.realtimeEmitter.on(`change:${table}`, callback);
      return () => this.realtimeEmitter.off(`change:${table}`, callback);
    } else {
      this.realtimeEmitter.on('change', tableOrCallback);
      return () => this.realtimeEmitter.off('change', tableOrCallback);
    }
  }

  async onModuleDestroy() {
    await this.subscriber?.close();
    await this.pool.end();
  }

  async getClient() {
    const client = await this.pool.connect();
    return {
      client,
      release: () => client.release(),
      query: <T = any>(text: string, params?: DatabaseParam[]): Promise<QueryResult<T>> =>
        client.query<T>(text, params),
      begin: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK'),
    };
  }
}