import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import createSubscriber from 'pg-listen';
import { EventEmitter } from 'events';

type DatabaseParam = string | number | boolean | null | string[] | number[] | Date;

export interface RealtimePayload {
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

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    this.realtimeEmitter = new EventEmitter();
    this.initializeRealtime();
  }

  private async initializeRealtime() {
    console.log('🔄 Initializing realtime in DatabaseService...');

    this.subscriber = createSubscriber({
      connectionString: process.env.DATABASE_URL,
    });

    this.subscriber.notifications.on('data_change', (payload: any) => {
          console.log('📡 DatabaseService received notification:', JSON.stringify(payload, null, 2));

      try {
        // const parsedPayload = JSON.parse(payload);
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
    } catch (error) {
      console.error('Failed to initialize realtime:', error);
    }
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
}