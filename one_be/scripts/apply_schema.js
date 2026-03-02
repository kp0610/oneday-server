import dotenv from 'dotenv';
import path from 'path';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    timezone: 'Asia/Seoul',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
});

async function applySchema() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Applying schema from database.sql...");

        const sqlFilePath = path.resolve(__dirname, '../database.sql');
        const schemaSql = await fs.readFile(sqlFilePath, 'utf8');

        // Split the SQL into individual statements and execute them
        // This is a naive split and might break for SQL with semicolons inside strings/comments
        const statements = schemaSql.split(/;\s*$/m);

        for (const statement of statements) {
            const trimmedStatement = statement.trim();
            if (trimmedStatement.length > 0) {
                // console.log("Executing:", trimmedStatement); // Debug: log each statement
                await connection.query(trimmedStatement);
            }
        }

        console.log("Database schema applied successfully.");
    } catch (error) {
        console.error("Error applying database schema:", error);
    } finally {
        if (connection) {
            connection.release();
        }
        await pool.end();
    }
}

applySchema().catch(console.error);
