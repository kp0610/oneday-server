const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware to parse JSON bodies
const jsonParser = express.json();

// @route   GET /api/stopwatch/categories/:userId
// @desc    Get stopwatch categories for a user
// @access  Private
router.get('/categories/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [categories] = await db.query(
            'SELECT * FROM stopwatch_categories WHERE user_id = ?',
            [userId]
        );
        if (categories.length > 0) {
            const categoryData = categories[0];
            try {
                if (typeof categoryData.data === 'string') {
                    categoryData.data = JSON.parse(categoryData.data);
                }
            } catch (e) {
                console.error(`Error parsing corrupted category data from DB for user ${userId}:`, e.message);
                categoryData.data = [];
            }
            if (!Array.isArray(categoryData.data)) categoryData.data = [];
            res.json(categoryData.data);
        } else {
            res.json(null); // No categories found for this user
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/stopwatch/categories
// @desc    Create or update stopwatch categories for a user
// @access  Private
router.post('/categories', jsonParser, async (req, res) => {
    const { userId, categoriesData } = req.body;
    if (!userId) {
        return res.status(400).json({ msg: 'User ID is required.' });
    }
    try {
        const sql = 'INSERT INTO stopwatch_categories (user_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)';
        const params = [userId, JSON.stringify(categoriesData || [])];
        await db.query(sql, params);
        res.status(201).json({ msg: 'Categories saved.' });
    } catch (err) {
        console.error('[CATEGORIES SAVE] CRITICAL ERROR:', err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET /api/stopwatch/:userId
// @desc    Get all stopwatch records for a specific user
// @access  Private
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [records] = await db.query(
            'SELECT * FROM stopwatch_records WHERE user_id = ? ORDER BY date DESC',
            [userId]
        );

        const processedRecords = records.map(record => {
            try {
                // Defensively parse JSON, handling cases where it might already be an object
                if (typeof record.tasks_data === 'string') {
                    record.tasks_data = JSON.parse(record.tasks_data);
                }
            } catch (e) {
                console.error(`Error parsing corrupted stopwatch data from DB for user ${record.user_id}, date ${record.date}:`, e.message);
                record.tasks_data = [];
            }
            // Ensure we always return arrays
            if (!Array.isArray(record.tasks_data)) record.tasks_data = [];
            
            return record;
        });

        res.json(processedRecords);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/stopwatch/:userId/:date
// @desc    Get stopwatch records for a specific user and date
// @access  Private
router.get('/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;

    try {
        const [records] = await db.query(
            'SELECT * FROM stopwatch_records WHERE user_id = ? AND date = ?',
            [userId, date]
        );

        if (records.length > 0) {
            const record = records[0];
            try {
                // Defensively parse JSON, handling cases where it might already be an object
                if (typeof record.tasks_data === 'string') {
                    record.tasks_data = JSON.parse(record.tasks_data);
                }
            } catch (e) {
                console.error(`Error parsing corrupted stopwatch data from DB for user ${userId}, date ${date}:`, e.message);
                // If parsing fails, default to empty arrays
                record.tasks_data = [];
            }
            // Ensure we always return arrays
            if (!Array.isArray(record.tasks_data)) record.tasks_data = [];

            res.json(record);
        } else {
            res.json(null); // No record found for this date
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/stopwatch
// @desc    Create or update a stopwatch record (upsert)
// @access  Private
router.post('/', jsonParser, async (req, res) => {
    const { userId, date, tasksData } = req.body;

    if (!userId || !date) {
        return res.status(400).json({ msg: 'User ID and date are required.' });
    }

    try {
        const sql = 'INSERT INTO stopwatch_records (user_id, `date`, tasks_data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE tasks_data = VALUES(tasks_data)';
        const params = [
            userId,
            date,
            JSON.stringify(tasksData || [])
        ];
        
        const [result] = await db.query(sql, params);

        res.status(201).json({ msg: 'Stopwatch data saved.', insertId: result.insertId });

    } catch (err) {
        console.error('[STOPWATCH SAVE] CRITICAL ERROR:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
