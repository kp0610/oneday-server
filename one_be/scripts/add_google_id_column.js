import db from '../config/db.js';

async function addGoogleIdColumn() {
    let connection;
    try {
        connection = await db.getConnection();
        console.log("Database connection established for adding google_id column.");

        console.log("Checking if 'google_id' column exists in 'users' table...");
        const [rows] = await connection.query(`
            SHOW COLUMNS FROM users LIKE 'google_id';
        `);

        if (rows.length === 0) {
            console.log("'google_id' column does not exist. Adding it now...");
            await connection.query(`
                ALTER TABLE users
                ADD COLUMN google_id VARCHAR(255) DEFAULT NULL AFTER email;
            `);
            console.log("'google_id' column added to 'users' table successfully.");
        } else {
            console.log("'google_id' column already exists in 'users' table. No action needed.");
        }

    } catch (error) {
        console.error("Error adding 'google_id' column to 'users' table:", error);
    } finally {
        if (connection) {
            connection.release();
            console.log("Database connection released.");
        }
    }
}

addGoogleIdColumn().catch(console.error);
