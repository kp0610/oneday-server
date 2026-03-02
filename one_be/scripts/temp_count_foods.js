import dotenv from 'dotenv';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dotenv loads from the correct .env file in the one_be directory
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

async function countFoodsInDB() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT COUNT(*) AS foodCount FROM foods');
        console.log(`Food count in 'foods' table: ${rows[0].foodCount}`);
    } catch (error) {
        console.error('Error counting foods in database:', error);
    } finally {
        if (connection) {
            connection.release();
        }
        await pool.end(); // Ensure the connection pool is closed
    }
}

countFoodsInDB().catch(console.error);
