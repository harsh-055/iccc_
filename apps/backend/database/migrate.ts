import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config({ path: join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  // Create migrations table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  
  const applied = await pool.query('SELECT name FROM migrations');
  const appliedMigrations = new Set(applied.rows.map(r => r.name));

  const migrationsDir = join(__dirname, 'migration');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (appliedMigrations.has(file)) {
      console.log(`✅ Skipped: ${file}`);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    console.log(`🚀 Running: ${file}`);
    await pool.query(sql);
    await pool.query('INSERT INTO migrations(name) VALUES($1)', [file]);
  }

  console.log('✅ Migrations complete.');
  await pool.end();
}

runMigrations().catch(err => {
  console.error('❌ Migration failed:', err);
  pool.end();
});
