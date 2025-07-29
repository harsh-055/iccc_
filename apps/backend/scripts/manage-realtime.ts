

import { config } from 'dotenv';
import { Pool } from 'pg';
import { join } from 'path';

// Load .env from backend directory
const envPath = join(__dirname, '../.env');
const result = config({ path: envPath });

// Debug: Check if DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please ensure your .env file contains DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'enable':
        await enableRealtime(args);
        break;
      case 'disable':
        await disableRealtime(args);
        break;
      case 'list':
        await listRealtimeTables();
        break;
      case 'enable-all':
        await enableAllTables();
        break;
      default:
        console.log(`
Usage:
  pnpm tsx scripts/manage-realtime.ts enable <table1> <table2> ...
  pnpm tsx scripts/manage-realtime.ts disable <table1> <table2> ...
  pnpm tsx scripts/manage-realtime.ts list
  pnpm tsx scripts/manage-realtime.ts enable-all
        `);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

async function enableRealtime(tables: string[]) {
  for (const table of tables) {
    await pool.query('SELECT add_realtime_trigger($1)', [table]);
    await pool.query(
      'INSERT INTO realtime_enabled_tables (table_name) VALUES ($1) ON CONFLICT DO NOTHING',
      [table]
    );
    console.log(`✅ Enabled realtime for: ${table}`);
  }
}

async function disableRealtime(tables: string[]) {
  for (const table of tables) {
    await pool.query('SELECT remove_realtime_trigger($1)', [table]);
    await pool.query('DELETE FROM realtime_enabled_tables WHERE table_name = $1', [table]);
    console.log(`❌ Disabled realtime for: ${table}`);
  }
}

async function listRealtimeTables() {
  try {
    const result = await pool.query('SELECT table_name FROM realtime_enabled_tables ORDER BY table_name');
    
    if (result.rows.length === 0) {
      console.log('\n❌ No tables have realtime enabled yet.');
      console.log('Use "pnpm run realtime:enable <table>" to enable realtime for a table.');
    } else {
      console.log('\n✅ Tables with realtime enabled:');
      result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    }
  } catch (error) {
    if (error.code === '42P01') {
      console.log('\n❌ Realtime not set up yet. Run migrations first:');
      console.log('  pnpm run migrate');
    } else {
      throw error;
    }
  }
}

async function enableAllTables() {
  const result = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('migrations', 'realtime_enabled_tables')
    AND tablename NOT LIKE 'pg_%'
  `);
  
  await enableRealtime(result.rows.map(r => r.tablename));
}

main();