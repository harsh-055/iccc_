import * as dotenv from "dotenv";
import { join } from "path";
import { Pool } from "pg";

dotenv.config({ path: join(__dirname, ".env") });
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    console.log("Attempting to connect...");
    const result = await pool.query("SELECT NOW() as current_time");
    console.log("✅ Database connected successfully!");
    console.log("Current time:", result.rows[0].current_time);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
  } finally {
    await pool.end();
  }
}

testConnection();
