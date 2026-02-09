const express = require('express');
const router = express.Router();
const db = require('../config/db');

// This needs a body parser. Since the global one in server.js was problematic,
// and other route files use their own, we will add one here.
router.use(express.json());

// @route   GET /api/events/range/:userId
// @desc    Get all events for a user within a date range
// @access  Private
router.get('/range/:userId', async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ msg: 'Start date and end date are required.' });
    }

    try {
        const [events] = await db.query(
            'SELECT * FROM events WHERE user_id = ? AND `date` >= ? AND `date` <= ? ORDER BY `date`, `time`',
            [userId, startDate, endDate]
        );
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: `Database error: ${err.message}` });
    }
});

// @route   GET /api/events/:userId/:date
// @desc    Get all events for a user on a specific date
// @access  Private
router.get('/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;
    try {
        const [events] = await db.query(
            'SELECT * FROM events WHERE user_id = ? AND `date` = ? ORDER BY `time`',
            [userId, date]
        );
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: `Database error: ${err.message}` });
    }
});

// @route   POST /api/events
// @desc    Create a new event or multiple recurring events
// @access  Private
router.post('/', async (req, res) => {
    const {
        userId,
        title,
        time,
        category,
        color, // Added color
        setReminder,
        startDate,
        endDate,
        selectedDays
    } = req.body;

    if (!userId || !title || !startDate) {
        return res.status(400).json({ msg: 'userId, title, and startDate are required.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        let newEvents = [];
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay); // Month is 0-indexed

        let end;
        if (endDate && endDate.length > 0) {
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            end = new Date(endYear, endMonth - 1, endDay);
        } else {
            end = new Date(startYear, startMonth - 1, startDay);
        }
        
        let currentDate = new Date(start);

        // Loop from start to end date
        while (currentDate <= end) {
            // If it's a repeating event, check if the day matches
            if (selectedDays && selectedDays.length > 0) {
                if (selectedDays.includes(currentDate.getDay())) {
                    const year = currentDate.getFullYear();
                    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
                    const day = currentDate.getDate().toString().padStart(2, '0');
                    const localDateString = `${year}-${month}-${day}`;
                    newEvents.push([
                        userId,
                        localDateString,
                        title,
                        time || null,
                        category || 'personal',
                        color || '#fffbe6', // Added color with default
                        setReminder || false
                    ]);
                }
            } else { // If not a repeating event, add every day in the range
                const year = currentDate.getFullYear();
                const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
                const day = currentDate.getDate().toString().padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                newEvents.push([
                    userId,
                    dateString,
                    title,
                    time || null,
                    category || 'personal',
                    color || '#fffbe6', // Added color with default
                    setReminder || false
                ]);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (newEvents.length > 0) {
            const sql = 'INSERT INTO events (user_id, `date`, title, `time`, category, color, setReminder) VALUES ?'; // Added color to INSERT
            await connection.query(sql, [newEvents]);
        }

        await connection.commit();
        res.status(201).json({ msg: 'Event(s) created successfully.' });

    } catch (err) {
        await connection.rollback();
        console.error(err.message);
        res.status(500).json({ msg: `Database error: ${err.message}` });
    } finally {
        connection.release();
    }
});

// @route   PUT /api/events/:eventId/complete
// @desc    Toggle event completion status
// @access  Private
router.put('/:eventId/complete', async (req, res) => {
    const { eventId } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
        return res.status(400).json({ msg: 'Completed status must be a boolean.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE events SET completed = ? WHERE id = ?',
            [completed, eventId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Event not found.' });
        }
        res.json({ msg: 'Event completion status updated.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: `Database error: ${err.message}` });
    }
});

// @route   DELETE /api/events/:eventId
// @desc    Delete an event
// @access  Private
router.delete('/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
        const [result] = await db.query('DELETE FROM events WHERE id = ?', [eventId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Event not found.' });
        }
        res.json({ msg: 'Event deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: `Database error: ${err.message}` });
    }
});

module.exports = router;