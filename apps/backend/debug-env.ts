import * as dotenv from "dotenv";
import { join } from "path";
console.log("Current __dirname:", __dirname);
console.log("Looking for .env at:", join(__dirname, "../.env"));
dotenv.config({ path: join(__dirname, "../.env") });
console.log("DATABASE_URL found:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL value:", process.env.DATABASE_URL);
