import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkTableStructure() {
  console.log('🔍 Checking permissions table structure...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'permissions'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Permissions table structure:');
    console.log('Column Name | Data Type | Nullable | Default');
    console.log('------------|-----------|----------|---------');
    
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(12)} | ${row.data_type.padEnd(9)} | ${row.is_nullable.padEnd(8)} | ${row.column_default || 'NULL'}`);
    });

    // Also check if there are any existing permissions
    const countResult = await client.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`\n📊 Current permissions count: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error(`❌ Error checking table structure: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkTableStructure();
}

export { checkTableStructure }; 