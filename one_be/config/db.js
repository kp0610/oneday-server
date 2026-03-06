import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ESM에서 __dirname 만들기
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env 경로 지정
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  timezone: "Asia/Seoul",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;